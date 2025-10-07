"""
Enhanced Monitoring Service for DREAM Tool
Migrated from TypeScript with advanced system monitoring and analytics capabilities
"""

import asyncio
import redis
import json
import time
import logging
import os
import psutil
import platform
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from dataclasses import dataclass, asdict
from collections import defaultdict, deque
import gzip
import pickle
from functools import wraps
import traceback
import sys

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@dataclass
class PerformanceMetric:
    type: str
    name: str
    duration: float
    start_time: float
    timestamp: str
    endpoint: Optional[str] = None
    user_id: Optional[str] = None
    request_id: Optional[str] = None

@dataclass
class RequestLog:
    timestamp: str
    method: str
    path: str
    status_code: int
    duration: float
    user_agent: Optional[str]
    ip_address: str
    headers: Dict[str, str]
    query_params: Dict[str, Any]
    body_size: int
    response_size: int
    user_id: Optional[str] = None
    error_details: Optional[str] = None

@dataclass
class APIUsageMetric:
    timestamp: str
    endpoint: str
    method: str
    user_id: Optional[str]
    ip_address: str
    user_agent: Optional[str]
    response_time: float
    status_code: int
    request_size: int
    response_size: int

@dataclass
class SystemMetrics:
    timestamp: str
    cpu_percent: float
    memory_percent: float
    memory_used_mb: float
    memory_total_mb: float
    disk_percent: float
    disk_used_gb: float
    disk_total_gb: float
    network_sent_mb: float
    network_received_mb: float
    active_connections: int
    process_count: int
    load_average: List[float]

@dataclass
class ErrorMetric:
    timestamp: str
    error_type: str
    error_message: str
    endpoint: str
    user_id: Optional[str]
    stack_trace: str
    request_data: Dict[str, Any]
    severity: str  # 'low', 'medium', 'high', 'critical'

@dataclass
class MonitoringStats:
    total_requests: int
    avg_response_time: float
    error_rate: float
    top_endpoints: List[Dict[str, Any]]
    top_users: List[Dict[str, Any]]
    system_health: Dict[str, Any]
    performance_trends: Dict[str, List[float]]
    recent_errors: List[ErrorMetric]

class MonitoringService:
    def __init__(self):
        self.redis_client = None
        self.metric_ttl = 86400 * 7  # 7 days
        self.performance_buffer = deque(maxlen=1000)  # In-memory buffer for real-time metrics
        self.system_metrics_interval = 60  # seconds
        self.last_system_check = 0
        self.request_counter = 0
        
        # Metric keys
        self.keys = {
            'performance': 'monitoring:performance',
            'requests': 'monitoring:requests',
            'api_usage': 'monitoring:api_usage',
            'system': 'monitoring:system',
            'errors': 'monitoring:errors',
            'alerts': 'monitoring:alerts'
        }
    
    async def __aenter__(self):
        """Async context manager entry"""
        await self._initialize()
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit"""
        await self._cleanup()
    
    async def _initialize(self):
        """Initialize monitoring service"""
        try:
            # Initialize Redis connection
            redis_host = os.getenv('REDIS_HOST', 'localhost')
            redis_port = int(os.getenv('REDIS_PORT', 6379))
            self.redis_client = redis.Redis(host=redis_host, port=redis_port, decode_responses=True)
            
            # Test Redis connection
            await asyncio.get_event_loop().run_in_executor(None, self.redis_client.ping)
            
            # Start system monitoring task
            asyncio.create_task(self._system_monitoring_loop())
            
            logger.info("Monitoring service initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize monitoring service: {e}")
            raise
    
    async def _cleanup(self):
        """Cleanup resources"""
        if self.redis_client:
            await asyncio.get_event_loop().run_in_executor(None, self.redis_client.close)
    
    def monitoring_middleware(self, func):
        """Decorator for monitoring API endpoints"""
        @wraps(func)
        async def wrapper(request, *args, **kwargs):
            start_time = time.time()
            request_id = f"req_{int(time.time() * 1000)}_{self.request_counter}"
            self.request_counter += 1
            
            try:
                # Extract request information
                method = getattr(request, 'method', 'UNKNOWN')
                path = getattr(request, 'url', {}).path if hasattr(request, 'url') else 'unknown'
                user_agent = getattr(request, 'headers', {}).get('user-agent', '')
                ip_address = getattr(request, 'client', {}).host if hasattr(request, 'client') else 'unknown'
                
                # Call the actual function
                response = await func(request, *args, **kwargs)
                
                # Calculate metrics
                duration = time.time() - start_time
                status_code = getattr(response, 'status_code', 200)
                
                # Log request
                await self._log_request(
                    method=method,
                    path=path,
                    status_code=status_code,
                    duration=duration,
                    user_agent=user_agent,
                    ip_address=ip_address,
                    request_id=request_id
                )
                
                # Log performance metric
                await self._log_performance_metric(
                    name=f"{method}_{path}",
                    duration=duration,
                    endpoint=path,
                    request_id=request_id
                )
                
                return response
                
            except Exception as e:
                duration = time.time() - start_time
                
                # Log error
                await self._log_error(
                    error_type=type(e).__name__,
                    error_message=str(e),
                    endpoint=path if 'path' in locals() else 'unknown',
                    stack_trace=traceback.format_exc(),
                    request_data={'method': method if 'method' in locals() else 'unknown'},
                    severity='high'
                )
                
                raise
        
        return wrapper
    
    async def _log_performance_metric(
        self,
        name: str,
        duration: float,
        endpoint: Optional[str] = None,
        user_id: Optional[str] = None,
        request_id: Optional[str] = None
    ):
        """Log performance metric"""
        try:
            metric = PerformanceMetric(
                type='request',
                name=name,
                duration=duration,
                start_time=time.time() - duration,
                timestamp=datetime.now().isoformat(),
                endpoint=endpoint,
                user_id=user_id,
                request_id=request_id
            )
            
            # Add to in-memory buffer for real-time access
            self.performance_buffer.append(metric)
            
            # Store in Redis
            metric_data = asdict(metric)
            await asyncio.get_event_loop().run_in_executor(
                None, self.redis_client.lpush, self.keys['performance'], json.dumps(metric_data)
            )
            await asyncio.get_event_loop().run_in_executor(
                None, self.redis_client.expire, self.keys['performance'], self.metric_ttl
            )
            
        except Exception as e:
            logger.error(f"Failed to log performance metric: {e}")
    
    async def _log_request(
        self,
        method: str,
        path: str,
        status_code: int,
        duration: float,
        user_agent: Optional[str],
        ip_address: str,
        request_id: str,
        headers: Optional[Dict[str, str]] = None,
        query_params: Optional[Dict[str, Any]] = None,
        body_size: int = 0,
        response_size: int = 0,
        user_id: Optional[str] = None,
        error_details: Optional[str] = None
    ):
        """Log request details"""
        try:
            request_log = RequestLog(
                timestamp=datetime.now().isoformat(),
                method=method,
                path=path,
                status_code=status_code,
                duration=duration,
                user_agent=user_agent,
                ip_address=ip_address,
                headers=headers or {},
                query_params=query_params or {},
                body_size=body_size,
                response_size=response_size,
                user_id=user_id,
                error_details=error_details
            )
            
            # Compress and store
            log_data = json.dumps(asdict(request_log))
            compressed_data = gzip.compress(log_data.encode())
            
            await asyncio.get_event_loop().run_in_executor(
                None, self.redis_client.lpush, self.keys['requests'], compressed_data
            )
            await asyncio.get_event_loop().run_in_executor(
                None, self.redis_client.expire, self.keys['requests'], self.metric_ttl
            )
            
        except Exception as e:
            logger.error(f"Failed to log request: {e}")
    
    async def _log_error(
        self,
        error_type: str,
        error_message: str,
        endpoint: str,
        stack_trace: str,
        request_data: Dict[str, Any],
        severity: str = 'medium',
        user_id: Optional[str] = None
    ):
        """Log error details"""
        try:
            error_metric = ErrorMetric(
                timestamp=datetime.now().isoformat(),
                error_type=error_type,
                error_message=error_message,
                endpoint=endpoint,
                user_id=user_id,
                stack_trace=stack_trace,
                request_data=request_data,
                severity=severity
            )
            
            error_data = json.dumps(asdict(error_metric))
            await asyncio.get_event_loop().run_in_executor(
                None, self.redis_client.lpush, self.keys['errors'], error_data
            )
            await asyncio.get_event_loop().run_in_executor(
                None, self.redis_client.expire, self.keys['errors'], self.metric_ttl
            )
            
            # Check if alert should be triggered
            if severity in ['high', 'critical']:
                await self._trigger_alert(error_metric)
            
        except Exception as e:
            logger.error(f"Failed to log error: {e}")
    
    async def _trigger_alert(self, error_metric: ErrorMetric):
        """Trigger alert for high/critical errors"""
        try:
            alert_data = {
                'type': 'error_alert',
                'severity': error_metric.severity,
                'error_type': error_metric.error_type,
                'endpoint': error_metric.endpoint,
                'timestamp': error_metric.timestamp,
                'message': f"{error_metric.error_type}: {error_metric.error_message}"
            }
            
            await asyncio.get_event_loop().run_in_executor(
                None, self.redis_client.lpush, self.keys['alerts'], json.dumps(alert_data)
            )
            await asyncio.get_event_loop().run_in_executor(
                None, self.redis_client.expire, self.keys['alerts'], self.metric_ttl
            )
            
            logger.warning(f"Alert triggered: {alert_data['message']}")
            
        except Exception as e:
            logger.error(f"Failed to trigger alert: {e}")
    
    async def _system_monitoring_loop(self):
        """Background task for system monitoring"""
        while True:
            try:
                await self._collect_system_metrics()
                await asyncio.sleep(self.system_metrics_interval)
            except Exception as e:
                logger.error(f"System monitoring error: {e}")
                await asyncio.sleep(60)  # Wait longer on error
    
    async def _collect_system_metrics(self):
        """Collect system performance metrics"""
        try:
            # CPU and Memory
            cpu_percent = psutil.cpu_percent(interval=1)
            memory = psutil.virtual_memory()
            
            # Disk usage
            disk = psutil.disk_usage('/')
            
            # Network stats
            network = psutil.net_io_counters()
            
            # System load
            load_avg = os.getloadavg() if hasattr(os, 'getloadavg') else [0, 0, 0]
            
            # Process count
            process_count = len(psutil.pids())
            
            # Network connections
            connections = len(psutil.net_connections())
            
            system_metrics = SystemMetrics(
                timestamp=datetime.now().isoformat(),
                cpu_percent=cpu_percent,
                memory_percent=memory.percent,
                memory_used_mb=memory.used / (1024 * 1024),
                memory_total_mb=memory.total / (1024 * 1024),
                disk_percent=disk.percent,
                disk_used_gb=disk.used / (1024 * 1024 * 1024),
                disk_total_gb=disk.total / (1024 * 1024 * 1024),
                network_sent_mb=network.bytes_sent / (1024 * 1024),
                network_received_mb=network.bytes_recv / (1024 * 1024),
                active_connections=connections,
                process_count=process_count,
                load_average=load_avg
            )
            
            # Store metrics
            metrics_data = json.dumps(asdict(system_metrics))
            await asyncio.get_event_loop().run_in_executor(
                None, self.redis_client.lpush, self.keys['system'], metrics_data
            )
            await asyncio.get_event_loop().run_in_executor(
                None, self.redis_client.expire, self.keys['system'], self.metric_ttl
            )
            
            # Check for system alerts
            await self._check_system_alerts(system_metrics)
            
        except Exception as e:
            logger.error(f"Failed to collect system metrics: {e}")
    
    async def _check_system_alerts(self, metrics: SystemMetrics):
        """Check system metrics for alert conditions"""
        alerts = []
        
        # CPU alert
        if metrics.cpu_percent > 90:
            alerts.append({
                'type': 'system_alert',
                'severity': 'high',
                'metric': 'cpu',
                'value': metrics.cpu_percent,
                'threshold': 90,
                'message': f"High CPU usage: {metrics.cpu_percent:.1f}%"
            })
        
        # Memory alert
        if metrics.memory_percent > 85:
            alerts.append({
                'type': 'system_alert',
                'severity': 'high',
                'metric': 'memory',
                'value': metrics.memory_percent,
                'threshold': 85,
                'message': f"High memory usage: {metrics.memory_percent:.1f}%"
            })
        
        # Disk alert
        if metrics.disk_percent > 90:
            alerts.append({
                'type': 'system_alert',
                'severity': 'critical',
                'metric': 'disk',
                'value': metrics.disk_percent,
                'threshold': 90,
                'message': f"High disk usage: {metrics.disk_percent:.1f}%"
            })
        
        # Store alerts
        for alert in alerts:
            alert['timestamp'] = datetime.now().isoformat()
            await asyncio.get_event_loop().run_in_executor(
                None, self.redis_client.lpush, self.keys['alerts'], json.dumps(alert)
            )
            logger.warning(f"System alert: {alert['message']}")
    
    async def get_monitoring_stats(self, time_range: int = 3600) -> MonitoringStats:
        """Get comprehensive monitoring statistics"""
        try:
            end_time = datetime.now()
            start_time = end_time - timedelta(seconds=time_range)
            
            # Get performance metrics
            performance_metrics = await self._get_recent_metrics(self.keys['performance'], time_range)
            request_logs = await self._get_recent_requests(time_range)
            error_metrics = await self._get_recent_errors(time_range)
            system_metrics = await self._get_recent_system_metrics(time_range)
            
            # Calculate statistics
            total_requests = len(request_logs)
            avg_response_time = sum(r.duration for r in request_logs) / total_requests if total_requests > 0 else 0
            error_count = len([r for r in request_logs if r.status_code >= 400])
            error_rate = (error_count / total_requests * 100) if total_requests > 0 else 0
            
            # Top endpoints
            endpoint_counts = defaultdict(int)
            endpoint_times = defaultdict(list)
            for log in request_logs:
                endpoint_counts[log.path] += 1
                endpoint_times[log.path].append(log.duration)
            
            top_endpoints = [
                {
                    'endpoint': endpoint,
                    'count': count,
                    'avg_time': sum(endpoint_times[endpoint]) / len(endpoint_times[endpoint])
                }
                for endpoint, count in sorted(endpoint_counts.items(), key=lambda x: x[1], reverse=True)[:10]
            ]
            
            # Top users (if user_id available)
            user_counts = defaultdict(int)
            for log in request_logs:
                if log.user_id:
                    user_counts[log.user_id] += 1
            
            top_users = [
                {'user_id': user_id, 'request_count': count}
                for user_id, count in sorted(user_counts.items(), key=lambda x: x[1], reverse=True)[:10]
            ]
            
            # System health
            latest_system_metric = system_metrics[0] if system_metrics else None
            system_health = {
                'cpu_percent': latest_system_metric.cpu_percent if latest_system_metric else 0,
                'memory_percent': latest_system_metric.memory_percent if latest_system_metric else 0,
                'disk_percent': latest_system_metric.disk_percent if latest_system_metric else 0,
                'status': 'healthy' if latest_system_metric and 
                         latest_system_metric.cpu_percent < 80 and 
                         latest_system_metric.memory_percent < 80 else 'warning'
            }
            
            # Performance trends
            performance_trends = {
                'response_times': [m.duration for m in performance_metrics[-100:]],  # Last 100 metrics
                'request_counts': self._calculate_hourly_request_counts(request_logs),
                'error_rates': self._calculate_hourly_error_rates(request_logs)
            }
            
            return MonitoringStats(
                total_requests=total_requests,
                avg_response_time=avg_response_time,
                error_rate=error_rate,
                top_endpoints=top_endpoints,
                top_users=top_users,
                system_health=system_health,
                performance_trends=performance_trends,
                recent_errors=error_metrics[:10]  # Last 10 errors
            )
            
        except Exception as e:
            logger.error(f"Failed to get monitoring stats: {e}")
            return MonitoringStats(
                total_requests=0,
                avg_response_time=0,
                error_rate=0,
                top_endpoints=[],
                top_users=[],
                system_health={'status': 'unknown'},
                performance_trends={},
                recent_errors=[]
            )
    
    async def _get_recent_metrics(self, key: str, time_range: int) -> List[PerformanceMetric]:
        """Get recent performance metrics"""
        try:
            raw_metrics = await asyncio.get_event_loop().run_in_executor(
                None, self.redis_client.lrange, key, 0, 1000
            )
            metrics = []
            cutoff_time = datetime.now() - timedelta(seconds=time_range)
            
            for raw in raw_metrics:
                data = json.loads(raw)
                metric_time = datetime.fromisoformat(data['timestamp'])
                if metric_time >= cutoff_time:
                    metrics.append(PerformanceMetric(**data))
            
            return metrics
        except Exception as e:
            logger.error(f"Failed to get recent metrics: {e}")
            return []
    
    async def _get_recent_requests(self, time_range: int) -> List[RequestLog]:
        """Get recent request logs"""
        try:
            raw_logs = await asyncio.get_event_loop().run_in_executor(
                None, self.redis_client.lrange, self.keys['requests'], 0, 1000
            )
            logs = []
            cutoff_time = datetime.now() - timedelta(seconds=time_range)
            
            for raw in raw_logs:
                # Decompress data
                decompressed = gzip.decompress(raw).decode()
                data = json.loads(decompressed)
                log_time = datetime.fromisoformat(data['timestamp'])
                if log_time >= cutoff_time:
                    logs.append(RequestLog(**data))
            
            return logs
        except Exception as e:
            logger.error(f"Failed to get recent requests: {e}")
            return []
    
    async def _get_recent_errors(self, time_range: int) -> List[ErrorMetric]:
        """Get recent error metrics"""
        try:
            raw_errors = await asyncio.get_event_loop().run_in_executor(
                None, self.redis_client.lrange, self.keys['errors'], 0, 100
            )
            errors = []
            cutoff_time = datetime.now() - timedelta(seconds=time_range)
            
            for raw in raw_errors:
                data = json.loads(raw)
                error_time = datetime.fromisoformat(data['timestamp'])
                if error_time >= cutoff_time:
                    errors.append(ErrorMetric(**data))
            
            return errors
        except Exception as e:
            logger.error(f"Failed to get recent errors: {e}")
            return []
    
    async def _get_recent_system_metrics(self, time_range: int) -> List[SystemMetrics]:
        """Get recent system metrics"""
        try:
            raw_metrics = await asyncio.get_event_loop().run_in_executor(
                None, self.redis_client.lrange, self.keys['system'], 0, 100
            )
            metrics = []
            cutoff_time = datetime.now() - timedelta(seconds=time_range)
            
            for raw in raw_metrics:
                data = json.loads(raw)
                metric_time = datetime.fromisoformat(data['timestamp'])
                if metric_time >= cutoff_time:
                    metrics.append(SystemMetrics(**data))
            
            return metrics
        except Exception as e:
            logger.error(f"Failed to get recent system metrics: {e}")
            return []
    
    def _calculate_hourly_request_counts(self, request_logs: List[RequestLog]) -> List[int]:
        """Calculate hourly request counts for the last 24 hours"""
        hourly_counts = [0] * 24
        now = datetime.now()
        
        for log in request_logs:
            log_time = datetime.fromisoformat(log.timestamp)
            hours_ago = int((now - log_time).total_seconds() / 3600)
            if 0 <= hours_ago < 24:
                hourly_counts[23 - hours_ago] += 1
        
        return hourly_counts
    
    def _calculate_hourly_error_rates(self, request_logs: List[RequestLog]) -> List[float]:
        """Calculate hourly error rates for the last 24 hours"""
        hourly_errors = [0] * 24
        hourly_total = [0] * 24
        now = datetime.now()
        
        for log in request_logs:
            log_time = datetime.fromisoformat(log.timestamp)
            hours_ago = int((now - log_time).total_seconds() / 3600)
            if 0 <= hours_ago < 24:
                index = 23 - hours_ago
                hourly_total[index] += 1
                if log.status_code >= 400:
                    hourly_errors[index] += 1
        
        return [
            (errors / total * 100) if total > 0 else 0
            for errors, total in zip(hourly_errors, hourly_total)
        ]
    
    async def clear_metrics(self, metric_type: Optional[str] = None):
        """Clear monitoring metrics"""
        try:
            if metric_type:
                if metric_type in self.keys:
                    await asyncio.get_event_loop().run_in_executor(
                        None, self.redis_client.delete, self.keys[metric_type]
                    )
                    logger.info(f"Cleared {metric_type} metrics")
            else:
                # Clear all metrics
                for key in self.keys.values():
                    await asyncio.get_event_loop().run_in_executor(
                        None, self.redis_client.delete, key
                    )
                logger.info("Cleared all monitoring metrics")
        except Exception as e:
            logger.error(f"Failed to clear metrics: {e}")

# Create singleton instance
monitoring_service = MonitoringService()
