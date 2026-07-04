import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { ForecastItem, AnomalyAlert } from '../services/api';
import '../assets/css/DashboardView.css';

interface DashboardViewProps {
  user?: {
    name: string;
    badgeNumber: string;
    role: string;
    station: string;
  } | null;
}

export function DashboardView({ user }: DashboardViewProps) {
  const [anomalies, setAnomalies] = useState<AnomalyAlert[]>([]);
  const [forecasts, setForecasts] = useState<ForecastItem[]>([]);
  const [dashboardLoading, setDashboardLoading] = useState(true);

  // Load Dashboard Data
  useEffect(() => {
    async function loadDashboard() {
      setDashboardLoading(true);
      try {
        const forecastData = await api.getForecast();
        setForecasts(forecastData.predictions);

        const anomalyData = await api.getAnomaly();
        setAnomalies(anomalyData.alerts);
      } catch (error) {
        console.error('Failed to load dashboard', error);
      } finally {
        setDashboardLoading(false);
      }
    }
    loadDashboard();
  }, []);

  // Acknowledge anomaly alert
  const handleAcknowledgeAnomaly = (id: string) => {
    setAnomalies(prev => prev.map(a => a.id === id ? { ...a, acknowledged: true } : a));
  };

  const isPolicymaker = user?.role === 'Policymaker';

  return (
    <div className="dashboard-grid">
      {/* Role Announcement Banner */}
      {user && (
        <div className="welcome-banner">
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', zIndex: 2 }}>
            <div className="welcome-avatar-container">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <h2 className="welcome-banner-title">Welcome back, Officer {user.name}</h2>
              <p className="welcome-banner-subtitle">
                <span>Clearance Level: <strong>{user.role}</strong></span>
                <span style={{ opacity: 0.5 }}>&bull;</span>
                <span>Active Duty Station: <strong>{user.station}</strong></span>
              </p>
            </div>
          </div>
          <div style={{ zIndex: 2 }}>
            <span className="badge badge-blue">{user.role} Intelligence Console</span>
          </div>
        </div>
      )}

      {/* Metrics row */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-info">
            <h3>{isPolicymaker ? 'State Active Investigations' : 'Active Investigations'}</h3>
            <div className="metric-value">{isPolicymaker ? '14,020' : '1,402'}</div>
            <div className="metric-delta delta-up">
              {isPolicymaker ? 'Statewide active registry' : '12% increase from previous month'}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h3>{isPolicymaker ? 'State District Anomalies' : 'Overnight Anomalies'}</h3>
            <div className="metric-value">
              {isPolicymaker ? '24' : anomalies.filter(a => !a.acknowledged).length}
            </div>
            <div className="metric-delta delta-down">
              {isPolicymaker 
                ? 'Flagged district deviations' 
                : `${anomalies.length} total active cases flagged, including ${anomalies.filter(a => !a.acknowledged).length} new overnight.`}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h3>Crime Risk Index</h3>
            <div className="metric-value">{isPolicymaker ? 'Moderate' : 'High'}</div>
            <div className="metric-delta delta-up">
              {isPolicymaker ? 'Statewide aggregated index' : 'Concentration around MG Road Corridor'}
            </div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h3>Entities Indexed</h3>
            <div className="metric-value">{isPolicymaker ? '459,210' : '45,921'}</div>
            <div className="metric-delta delta-up">
              {isPolicymaker ? 'Combined state repositories' : '231 additions added today'}
            </div>
          </div>
        </div>
      </div>

      {/* Splits */}
      <div className="dashboard-split-row">
        {/* Left Card: 7-Day Forecasting */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">
              {isPolicymaker ? 'State-Level Aggregated Forecasting' : 'Time Series Crime Forecasting'}
            </h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>
              {isPolicymaker ? 'Statewide Aggregations' : 'Region: Bangalore East District'}
            </span>
          </div>
          {dashboardLoading ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', padding: '10px 0' }}>
              <div style={{ display: 'flex', gap: '16px' }}>
                <div className="skeleton-title skeleton-shimmer" style={{ width: '20%', height: '16px' }} />
                <div className="skeleton-title skeleton-shimmer" style={{ width: '15%', height: '16px' }} />
                <div className="skeleton-title skeleton-shimmer" style={{ width: '15%', height: '16px' }} />
                <div className="skeleton-title skeleton-shimmer" style={{ width: '25%', height: '16px' }} />
                <div className="skeleton-title skeleton-shimmer" style={{ width: '15%', height: '16px' }} />
              </div>
              <div className="skeleton-block skeleton-shimmer" style={{ height: '35px' }} />
              <div className="skeleton-block skeleton-shimmer" style={{ height: '35px' }} />
              <div className="skeleton-block skeleton-shimmer" style={{ height: '35px' }} />
              <div className="skeleton-block skeleton-shimmer" style={{ height: '35px' }} />
            </div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Crime Type</th>
                    <th>Risk Level</th>
                    <th>Trend Shift</th>
                    <th>Peak Window</th>
                    <th>{isPolicymaker ? 'High Risk Districts' : 'Patrol Corridors'}</th>
                    <th>Confidence</th>
                  </tr>
                </thead>
                <tbody>
                  {forecasts.map((f, i) => (
                    <tr key={i}>
                      <td style={{ fontWeight: 600 }}>{f.crimeType}</td>
                      <td>
                        <span className={`badge ${f.riskLevel === 'HIGH' ? 'badge-red' : 'badge-blue'}`}>
                          {f.riskLevel}
                        </span>
                      </td>
                      <td style={{ color: f.increasePercentage > 100 ? 'var(--accent-rose)' : 'var(--accent-amber)', fontWeight: 'bold' }}>
                        +{f.increasePercentage}%
                      </td>
                      <td>{f.peakWindow}</td>
                      <td>{isPolicymaker ? 'Bangalore East, Mysore, Belagavi' : f.hotLocations.join(', ')}</td>
                      <td>{(f.confidence * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Card: Anomaly Surveillance (Investigators/Analysts/Supervisors) OR Socio-Demographics (Policymakers) */}
        {isPolicymaker ? (
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">Socio-Demographic Crime Correlations</h3>
              <span className="badge badge-emerald">Census & PLFS Indicators</span>
            </div>
            <p style={{ fontSize: '12px', color: 'var(--text-secondary)', marginBottom: '14px' }}>
              District indicators showing Literacy, Unemployment, and their relative correlation to Property & Cyber Crimes.
            </p>
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>District</th>
                    <th>Literacy</th>
                    <th>Unemployment</th>
                    <th>Crime Correlation</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td><strong>Bangalore East</strong></td>
                    <td>87.6%</td>
                    <td>4.8%</td>
                    <td><span className="badge badge-red">+0.78 (Cyber)</span></td>
                  </tr>
                  <tr>
                    <td><strong>Belagavi</strong></td>
                    <td>73.5%</td>
                    <td>5.2%</td>
                    <td><span className="badge badge-blue">+0.34 (Property)</span></td>
                  </tr>
                  <tr>
                    <td><strong>Hubli-Dharwad</strong></td>
                    <td>80.1%</td>
                    <td>6.1%</td>
                    <td><span className="badge badge-amber">+0.58 (Property)</span></td>
                  </tr>
                  <tr>
                    <td><strong>Mysore</strong></td>
                    <td>82.3%</td>
                    <td>3.9%</td>
                    <td><span className="badge badge-blue">+0.42 (Overall)</span></td>
                  </tr>
                  <tr>
                    <td><strong>Mangalore</strong></td>
                    <td>89.2%</td>
                    <td>4.1%</td>
                    <td><span className="badge badge-red">+0.68 (Cyber)</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="dashboard-card">
            <div className="card-header">
              <h3 className="card-title">Real-time Anomaly Alerts</h3>
            </div>
            {dashboardLoading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid var(--card-border)', paddingLeft: '12px' }}>
                  <div className="skeleton-title skeleton-shimmer" style={{ width: '70%', height: '14px', marginBottom: '6px' }} />
                  <div className="skeleton-text skeleton-shimmer" style={{ height: '10px', width: '90%' }} />
                  <div className="skeleton-text skeleton-shimmer" style={{ height: '10px', width: '40%' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid var(--card-border)', paddingLeft: '12px' }}>
                  <div className="skeleton-title skeleton-shimmer" style={{ width: '50%', height: '14px', marginBottom: '6px' }} />
                  <div className="skeleton-text skeleton-shimmer" style={{ height: '10px', width: '95%' }} />
                  <div className="skeleton-text skeleton-shimmer" style={{ height: '10px', width: '45%' }} />
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', borderLeft: '4px solid var(--card-border)', paddingLeft: '12px' }}>
                  <div className="skeleton-title skeleton-shimmer" style={{ width: '60%', height: '14px', marginBottom: '6px' }} />
                  <div className="skeleton-text skeleton-shimmer" style={{ height: '10px', width: '85%' }} />
                  <div className="skeleton-text skeleton-shimmer" style={{ height: '10px', width: '35%' }} />
                </div>
              </div>
            ) : (
              <div className="anomaly-list">
                {anomalies.map((a, i) => (
                  <div key={i} className="anomaly-alert-item" style={{ borderLeftColor: a.acknowledged ? 'var(--accent-emerald)' : 'var(--accent-rose)', opacity: a.acknowledged ? 0.6 : 1 }}>
                    <div className="anomaly-header">
                      <span className="anomaly-title" style={{ color: a.acknowledged ? 'var(--accent-emerald)' : 'var(--accent-rose)' }}>
                        {a.station} &bull; {a.crimeType}
                      </span>
                      <span className="anomaly-time">3-hour observation window</span>
                    </div>
                    <div className="anomaly-body">
                      Registered {a.firCountLast3Hours} cases vs historical average of {a.historicalAverage}.
                      Spike is +{a.deviationPercentage}% above normal levels.
                    </div>
                    <div className="anomaly-meta">
                      <span style={{ color: 'var(--text-muted)' }}>Confidence: {(a.confidence * 100).toFixed(0)}%</span>
                      {!a.acknowledged ? (
                        <button className="anomaly-btn" onClick={() => handleAcknowledgeAnomaly(a.id)}>Acknowledge</button>
                      ) : (
                        <span style={{ color: 'var(--accent-emerald)' }}>Acknowledged</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
