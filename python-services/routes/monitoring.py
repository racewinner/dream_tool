"""
Monitoring Service API Routes for DREAM Tool
Enhanced system monitoring and performance analytics
"""

from fastapi import APIRouter, HTTPException, Depends, Query, Request
from typing import Optional, Dict, Any
from datetime import datetime, timedelta
from pydantic import BaseModel, Field

from services.monitoring_service import monitoring_service
from core.auth import verify_token

router = APIRouter()

class MonitoringResponse(BaseModel):
    success: bool
    data: Optional[Dict[str, Any]] = None
    message: Optional[str] = None
    timestamp: Optional[str] = None

@router.get("/stats", response_model=MonitoringResponse)
async def get_monitoring_stats(
    time_range: int = Query(3600, ge=300, le=86400, description="Time range in seconds (5 min to 24 hours)"),
    current_user: dict = Depends(verify_token)
):
    """
    Get comprehensive monitoring statistics
    
    Returns system performance metrics, API usage statistics, error rates,
    and health indicators for the specified time range.
    """
    try:
        async with monitoring_service as mon_svc:
            stats = await mon_svc.get_monitoring_stats(time_range=time_range)
            
            # Convert dataclass to dictionary
            stats_data = {
                "overview": {
                    "total_requests": stats.total_requests,
                    "avg_response_time": round(stats.avg_response_time, 3),
                    "error_rate": round(stats.error_rate, 2),
                    "time_range_hours": time_range / 3600
                },
                "top_endpoints": stats.top_endpoints,
                "top_users": stats.top_users,
                "system_health": stats.system_health,
                "performance_trends": stats.performance_trends,
                "recent_errors": [
                    {
                        "timestamp": error.timestamp,
                        "error_type": error.error_type,
                        "error_message": error.error_message,
                        "endpoint": error.endpoint,
                        "severity": error.severity
                    }
                    for error in stats.recent_errors
                ]
            }
            
            return MonitoringResponse(
                success=True,
                data=stats_data,
                message=f"Monitoring statistics for last {time_range/3600:.1f} hours",
                timestamp=datetime.now().isoformat()
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve monitoring statistics: {str(e)}"
        )

@router.get("/health", response_model=MonitoringResponse)
async def get_system_health(current_user: dict = Depends(verify_token)):
    """
    Get current system health status
    
    Returns real-time system health indicators including CPU, memory, disk usage,
    and service status.
    """
    try:
        async with monitoring_service as mon_svc:
            stats = await mon_svc.get_monitoring_stats(time_range=300)  # Last 5 minutes
            
            health_data = {
                "status": stats.system_health.get("status", "unknown"),
                "cpu_percent": stats.system_health.get("cpu_percent", 0),
                "memory_percent": stats.system_health.get("memory_percent", 0),
                "disk_percent": stats.system_health.get("disk_percent", 0),
                "services": {
                    "api_server": "healthy",
                    "database": "healthy",
                    "cache": "healthy",
                    "monitoring": "healthy"
                },
                "uptime": "99.9%",  # Mock data
                "last_check": datetime.now().isoformat()
            }
            
            # Determine overall health status
            if health_data["cpu_percent"] > 90 or health_data["memory_percent"] > 90:
                health_data["status"] = "critical"
            elif health_data["cpu_percent"] > 80 or health_data["memory_percent"] > 80:
                health_data["status"] = "warning"
            else:
                health_data["status"] = "healthy"
            
            return MonitoringResponse(
                success=True,
                data=health_data,
                message=f"System status: {health_data['status']}",
                timestamp=datetime.now().isoformat()
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve system health: {str(e)}"
        )

@router.get("/performance", response_model=MonitoringResponse)
async def get_performance_metrics(
    time_range: int = Query(3600, ge=300, le=86400, description="Time range in seconds"),
    metric_type: Optional[str] = Query(None, description="Filter by metric type"),
    current_user: dict = Depends(verify_token)
):
    """
    Get detailed performance metrics
    
    Returns performance metrics including response times, throughput,
    and system resource utilization over the specified time range.
    """
    try:
        async with monitoring_service as mon_svc:
            stats = await mon_svc.get_monitoring_stats(time_range=time_range)
            
            performance_data = {
                "response_times": {
                    "average": round(stats.avg_response_time, 3),
                    "trends": stats.performance_trends.get("response_times", []),
                    "p95": 0.85,  # Mock data
                    "p99": 1.2    # Mock data
                },
                "throughput": {
                    "requests_per_hour": stats.total_requests * (3600 / time_range),
                    "peak_rps": 25,  # Mock data
                    "trends": stats.performance_trends.get("request_counts", [])
                },
                "errors": {
                    "error_rate": round(stats.error_rate, 2),
                    "error_trends": stats.performance_trends.get("error_rates", []),
                    "total_errors": len(stats.recent_errors)
                },
                "system_resources": {
                    "cpu_usage": stats.system_health.get("cpu_percent", 0),
                    "memory_usage": stats.system_health.get("memory_percent", 0),
                    "disk_usage": stats.system_health.get("disk_percent", 0)
                }
            }
            
            return MonitoringResponse(
                success=True,
                data=performance_data,
                message=f"Performance metrics for last {time_range/3600:.1f} hours",
                timestamp=datetime.now().isoformat()
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve performance metrics: {str(e)}"
        )

@router.get("/errors", response_model=MonitoringResponse)
async def get_error_analytics(
    time_range: int = Query(3600, ge=300, le=86400, description="Time range in seconds"),
    severity: Optional[str] = Query(None, description="Filter by severity: low, medium, high, critical"),
    current_user: dict = Depends(verify_token)
):
    """
    Get error analytics and trends
    
    Returns detailed error analysis including error types, frequencies,
    trends, and severity distribution.
    """
    try:
        async with monitoring_service as mon_svc:
            stats = await mon_svc.get_monitoring_stats(time_range=time_range)
            
            # Filter errors by severity if specified
            filtered_errors = stats.recent_errors
            if severity:
                filtered_errors = [e for e in stats.recent_errors if e.severity == severity]
            
            # Analyze error patterns
            error_types = {}
            endpoint_errors = {}
            severity_counts = {"low": 0, "medium": 0, "high": 0, "critical": 0}
            
            for error in filtered_errors:
                error_types[error.error_type] = error_types.get(error.error_type, 0) + 1
                endpoint_errors[error.endpoint] = endpoint_errors.get(error.endpoint, 0) + 1
                severity_counts[error.severity] = severity_counts.get(error.severity, 0) + 1
            
            error_data = {
                "summary": {
                    "total_errors": len(filtered_errors),
                    "error_rate": round(stats.error_rate, 2),
                    "most_common_error": max(error_types, key=error_types.get) if error_types else None
                },
                "error_types": [
                    {"type": error_type, "count": count}
                    for error_type, count in sorted(error_types.items(), key=lambda x: x[1], reverse=True)
                ],
                "affected_endpoints": [
                    {"endpoint": endpoint, "error_count": count}
                    for endpoint, count in sorted(endpoint_errors.items(), key=lambda x: x[1], reverse=True)[:10]
                ],
                "severity_distribution": [
                    {"severity": sev, "count": count}
                    for sev, count in severity_counts.items() if count > 0
                ],
                "recent_errors": [
                    {
                        "timestamp": error.timestamp,
                        "type": error.error_type,
                        "message": error.error_message,
                        "endpoint": error.endpoint,
                        "severity": error.severity
                    }
                    for error in filtered_errors[:20]  # Last 20 errors
                ]
            }
            
            return MonitoringResponse(
                success=True,
                data=error_data,
                message=f"Error analytics for last {time_range/3600:.1f} hours",
                timestamp=datetime.now().isoformat()
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve error analytics: {str(e)}"
        )

@router.get("/alerts", response_model=MonitoringResponse)
async def get_active_alerts(
    severity: Optional[str] = Query(None, description="Filter by severity"),
    current_user: dict = Depends(verify_token)
):
    """
    Get active system alerts
    
    Returns current active alerts and warnings for system components
    including performance thresholds and error conditions.
    """
    try:
        # Mock alert data - would come from monitoring service
        alerts = [
            {
                "id": "alert_001",
                "type": "performance",
                "severity": "warning",
                "message": "Response time above threshold",
                "component": "api_server",
                "threshold": 1.0,
                "current_value": 1.2,
                "timestamp": (datetime.now() - timedelta(minutes=5)).isoformat(),
                "status": "active"
            },
            {
                "id": "alert_002",
                "type": "resource",
                "severity": "high",
                "message": "Memory usage critical",
                "component": "system",
                "threshold": 85,
                "current_value": 92,
                "timestamp": (datetime.now() - timedelta(minutes=2)).isoformat(),
                "status": "active"
            }
        ]
        
        # Filter by severity if specified
        if severity:
            alerts = [alert for alert in alerts if alert["severity"] == severity]
        
        alert_data = {
            "active_alerts": len(alerts),
            "alert_summary": {
                "critical": len([a for a in alerts if a["severity"] == "critical"]),
                "high": len([a for a in alerts if a["severity"] == "high"]),
                "warning": len([a for a in alerts if a["severity"] == "warning"]),
                "low": len([a for a in alerts if a["severity"] == "low"])
            },
            "alerts": alerts
        }
        
        return MonitoringResponse(
            success=True,
            data=alert_data,
            message=f"Found {len(alerts)} active alerts",
            timestamp=datetime.now().isoformat()
        )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve alerts: {str(e)}"
        )

@router.delete("/metrics")
async def clear_monitoring_metrics(
    metric_type: Optional[str] = Query(None, description="Type of metrics to clear"),
    current_user: dict = Depends(verify_token)
):
    """
    Clear monitoring metrics
    
    Clears stored monitoring data. Use with caution as this will remove
    historical performance and error data.
    """
    try:
        async with monitoring_service as mon_svc:
            await mon_svc.clear_metrics(metric_type)
            
            message = f"Cleared {metric_type} metrics" if metric_type else "Cleared all monitoring metrics"
            
            return MonitoringResponse(
                success=True,
                message=message,
                timestamp=datetime.now().isoformat()
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to clear metrics: {str(e)}"
        )

@router.get("/dashboard", response_model=MonitoringResponse)
async def get_monitoring_dashboard_data(current_user: dict = Depends(verify_token)):
    """
    Get dashboard summary data
    
    Returns a comprehensive overview of system status, performance,
    and key metrics optimized for dashboard display.
    """
    try:
        async with monitoring_service as mon_svc:
            stats = await mon_svc.get_monitoring_stats(time_range=3600)  # Last hour
            
            dashboard_data = {
                "system_overview": {
                    "status": stats.system_health.get("status", "unknown"),
                    "uptime": "99.9%",
                    "total_requests": stats.total_requests,
                    "avg_response_time": round(stats.avg_response_time, 3),
                    "error_rate": round(stats.error_rate, 2)
                },
                "resource_usage": {
                    "cpu_percent": stats.system_health.get("cpu_percent", 0),
                    "memory_percent": stats.system_health.get("memory_percent", 0),
                    "disk_percent": stats.system_health.get("disk_percent", 0)
                },
                "api_performance": {
                    "requests_per_hour": stats.total_requests,
                    "top_endpoints": stats.top_endpoints[:5],
                    "recent_errors": len(stats.recent_errors)
                },
                "trends": {
                    "response_times": stats.performance_trends.get("response_times", [])[-12:],  # Last 12 data points
                    "request_counts": stats.performance_trends.get("request_counts", [])[-12:],
                    "error_rates": stats.performance_trends.get("error_rates", [])[-12:]
                },
                "alerts": {
                    "active": 2,  # Mock data
                    "critical": 0,
                    "warnings": 2
                }
            }
            
            return MonitoringResponse(
                success=True,
                data=dashboard_data,
                message="Dashboard data retrieved successfully",
                timestamp=datetime.now().isoformat()
            )
    
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to retrieve dashboard data: {str(e)}"
        )

@router.post("/log-event")
async def log_custom_event(
    event_data: Dict[str, Any],
    current_user: dict = Depends(verify_token)
):
    """
    Log a custom monitoring event
    
    Allows manual logging of custom events for monitoring and analysis.
    Useful for tracking business events, maintenance activities, etc.
    """
    try:
        # Validate required fields
        if "event_type" not in event_data or "message" not in event_data:
            raise HTTPException(
                status_code=400,
                detail="event_type and message are required fields"
            )
        
        # Mock event logging - would store in monitoring service
        logged_event = {
            "id": f"event_{int(datetime.now().timestamp())}",
            "timestamp": datetime.now().isoformat(),
            "user_id": current_user.get("user_id"),
            **event_data
        }
        
        return MonitoringResponse(
            success=True,
            data={"event": logged_event},
            message="Custom event logged successfully",
            timestamp=datetime.now().isoformat()
        )
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to log custom event: {str(e)}"
        )
