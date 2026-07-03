import { useState } from 'react';

interface LoginViewProps {
  onLogin: (user: { name: string; badgeNumber: string; role: string; station: string }) => void;
}

export function LoginView({ onLogin }: LoginViewProps) {
  const [badgeNumber, setBadgeNumber] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!badgeNumber.trim() || !password.trim()) {
      setError('Please enter both Badge Number and Access PIN.');
      return;
    }

    setLoading(true);

    // Simulate authentication check
    setTimeout(() => {
      setLoading(false);
      // Hardcoded credentials for development
      if (badgeNumber.trim() === 'KSP-7482' && password === 'password') {
        onLogin({
          name: 'Inspector Verma',
          badgeNumber: 'KSP-7482',
          role: 'Crime Intelligence Officer',
          station: 'Banaswadi PS'
        });
      } else {
        setError('Invalid Badge Number or Access PIN. Use KSP-7482 & password.');
      }
    }, 800);
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <img src="/Main-logo.png" alt="DRISHTI Logo" className="login-logo" />
        <h1 className="login-title">DRISHTI</h1>
        <p className="login-subtitle">Karnataka State Police &mdash; Crime Analytics Portal</p>

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
