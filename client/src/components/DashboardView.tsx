import { useState, useEffect } from 'react';
import { api } from '../services/api';
import type { ForecastItem, AnomalyAlert } from '../services/api';

export function DashboardView() {
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

  return (
    <div className="dashboard-grid">
      {/* Metrics row */}
      <div className="metrics-row">
        <div className="metric-card">
          <div className="metric-info">
            <h3>Active Investigations</h3>
            <div className="metric-value">1,402</div>
            <div className="metric-delta delta-up">12% increase from previous month</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h3>Overnight Anomalies</h3>
            <div className="metric-value">{anomalies.filter(a => !a.acknowledged).length}</div>
            <div className="metric-delta delta-down">4 active cases flagged</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h3>Crime Risk Index</h3>
            <div className="metric-value">High</div>
            <div className="metric-delta delta-up">Concentration around MG Road Corridor</div>
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-info">
            <h3>Entities Indexed</h3>
            <div className="metric-value">45,921</div>
            <div className="metric-delta delta-up">231 additions added today</div>
          </div>
        </div>
      </div>

      {/* Splits */}
      <div className="dashboard-split-row">
        {/* Left Card: 7-Day Forecasting */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Time Series Crime Forecasting</h3>
            <span style={{ fontSize: '12px', color: 'var(--text-secondary)' }}>Region: Bangalore East District</span>
          </div>
          {dashboardLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner"></div></div>
          ) : (
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Crime Type</th>
                    <th>Risk Level</th>
                    <th>Trend Shift</th>
                    <th>Peak Window</th>
                    <th>Patrol Corridors</th>
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
                      <td>{f.hotLocations.join(', ')}</td>
                      <td>{(f.confidence * 100).toFixed(0)}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Right Card: Anomaly Surveillance */}
        <div className="dashboard-card">
          <div className="card-header">
            <h3 className="card-title">Real-time Anomaly Alerts</h3>
          </div>
          {dashboardLoading ? (
            <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}><div className="spinner"></div></div>
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
      </div>
    </div>
  );
}
