import React, { useState, useEffect } from 'react';
import { message, Spin } from 'antd';
import { useApi } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { MaintenanceAnalyticsResponse } from '../types/solarSystem';
import Chart from 'react-apexcharts';
import styles from './MaintenanceAnalytics.module.css';

const MaintenanceAnalytics: React.FC = () => {
  const [analytics, setAnalytics] = useState<MaintenanceAnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const api = useApi(null);
  const auth = useAuth();

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await api.getMaintenanceAnalytics(auth.selectedSystemId!);
      setAnalytics(data);
    } catch (err) {
      const error = err instanceof Error ? err.message : 'Failed to fetch maintenance analytics';
      setError(error);
      message.error(error);
    } finally {
      setLoading(false);
    }
  };

  const maintenanceCostChart = {
    options: {
      chart: {
        type: 'bar' as const,
        height: 350,
        toolbar: {
          show: true,
          autoSelected: 'zoom' as const
        },
        zoom: {
          enabled: true,
          type: 'x' as const,
          autoScaleYaxis: true
        }
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 4,
          borderRadiusApplication: 'end' as const
        },
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        labels: {
          style: {
            colors: '#666'
          }
        }
      },
      yaxis: {
        title: {
          text: 'Cost ($)',
          style: {
            color: '#666'
          }
        },
        labels: {
          formatter: function (val: number) {
            return "$ " + val.toLocaleString()
          },
          style: {
            colors: '#666'
          }
        }
      },
      fill: {
        opacity: 0.8,
        colors: ['#1890ff']
      },
      tooltip: {
        enabled: true,
        theme: 'dark',
        y: {
          formatter: function (val: number) {
            return "$ " + val.toLocaleString()
          }
        }
      },
      legend: {
        show: false
      }
    },
    series: [{
      name: 'Maintenance Cost',
      data: analytics?.monthlyMaintenanceCosts || []
    }]
  };

  const downtimeChart = {
    options: {
      chart: {
        type: 'line' as const,
        height: 350,
        toolbar: {
          show: true,
          autoSelected: 'zoom' as const
        },
        zoom: {
          enabled: true,
          type: 'x' as const,
          autoScaleYaxis: true
        }
      },
      stroke: {
        curve: 'smooth' as const,
        width: 3,
        colors: ['#1890ff']
      },
      xaxis: {
        categories: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'],
        labels: {
          style: {
            colors: '#666'
          }
        }
      },
      yaxis: {
        title: {
          text: 'Hours',
          style: {
            color: '#666'
          }
        },
        labels: {
          style: {
            colors: '#666'
          }
        }
      },
      tooltip: {
        enabled: true,
        theme: 'dark',
        y: {
          formatter: function (val: number) {
            return val.toFixed(1) + " hrs"
          }
        }
      },
      legend: {
        show: false
      },
      grid: {
        borderColor: '#f0f0f0',
        strokeDashArray: 2
      }
    },
    series: [{
      name: 'Downtime',
      data: analytics?.monthlyDowntime || []
    }]
  };

  if (loading) {
    return (
      <div className={styles['maintenance-analytics']} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles['maintenance-analytics']} style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '400px' }}>
        <div style={{ textAlign: 'center' }}>
          <h3 style={{ color: '#ff4d4f' }}>Error</h3>
          <p>{error}</p>
          <button onClick={fetchAnalytics} style={{
            padding: '8px 16px',
            background: '#1890ff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginTop: '16px'
          }}>
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={styles['maintenance-analytics']}>
      <div className={styles['stats-grid']}>
        <div className={styles['stat-card']}>
          <h3>Total Maintenance Cost</h3>
          <p>${analytics?.totalCost?.toFixed(2) || 0}</p>
        </div>
        <div className={styles['stat-card']}>
          <h3>Average Monthly Cost</h3>
          <p>${analytics?.averageMonthlyCost?.toFixed(2) || 0}</p>
        </div>
        <div className={styles['stat-card']}>
          <h3>Total Downtime</h3>
          <p>{analytics?.totalDowntime || 0} hours</p>
        </div>
        <div className={styles['stat-card']}>
          <h3>System Availability</h3>
          <p>{analytics?.systemAvailability?.toFixed(2) || 0}%</p>
        </div>
      </div>

      <div className={styles['charts-container']}>
        <div className={styles['chart-card']}>
          <h3>Monthly Maintenance Costs</h3>
          <Chart options={maintenanceCostChart.options} series={maintenanceCostChart.series} type="bar" height={350} />
        </div>
        <div className={styles['chart-card']}>
          <h3>Monthly Downtime</h3>
          <Chart options={downtimeChart.options} series={downtimeChart.series} type="line" height={350} />
        </div>
      </div>
    </div>
  );
};

export default MaintenanceAnalytics;
