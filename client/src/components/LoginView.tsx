import { useState } from 'react';
import { api } from '../services/api';
import '../assets/css/LoginView.css';

interface LoginViewProps {
  onLogin: (user: { name: string; badgeNumber: string; role: string; station: string }) => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [badgeNumber, setBadgeNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!badgeNumber.trim() || !password.trim()) {
      setError('Please enter both Badge Number and Access PIN.');
      return;
    }

    setLoading(true);

    try {
      const res = await api.login(badgeNumber, password);
      setLoading(false);
      if (res.success && res.user) {
        onLogin(res.user);
      } else {
        setError(res.message || 'Invalid credentials.');
      }
    } catch (err) {
      setLoading(false);
      setError('Connection to authentication services failed.');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src="/Main-logo.png" alt="DRISHTI Logo" className="login-logo" />
        <h1 className="login-title">DRISHTI</h1>
        <p className="login-subtitle">Karnataka State Police &mdash; Crime Analytics Portal</p>
        <div className="login-badge">Secure Intel Channel &bull; Level 3 Access</div>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label htmlFor="badgeNumber">Officer Badge Number</label>
            <input
              type="text"
              id="badgeNumber"
              className="form-input"
              placeholder="e.g. KSP-7482"
              value={badgeNumber}
              onChange={(e) => setBadgeNumber(e.target.value)}
              disabled={loading}
              autoComplete="username"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Access PIN / Password</label>
            <input
              type="password"
              id="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              disabled={loading}
              autoComplete="current-password"
            />
          </div>

          <button type="submit" className="login-btn" disabled={loading}>
            {loading ? 'Verifying Identity...' : 'Sign In'}
          </button>
        </form>

        <div className="login-footer">
          <p>Restricted access for authorized KSP personnel only.</p>
          <p style={{ marginTop: '4px' }}>IP logged: 10.142.0.84</p>
        </div>
      </div>
    </div>
  );
}
