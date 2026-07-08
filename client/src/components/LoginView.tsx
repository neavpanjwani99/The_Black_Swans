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
      // Check if Catalyst Web SDK is loaded (for production Zoho environment)
      const catalyst = (window as any).catalyst;
      if (catalyst && catalyst.auth) {
        try {
          // Catalyst requires an email-formatted login ID.
          // Map badge ID to simulated KSP email domain for authentication
          const email = badgeNumber.includes('@') ? badgeNumber : `${badgeNumber.toLowerCase().replace(/[^a-z0-9]/g, '')}@ksp.gov.in`;
          
          await catalyst.auth.signIn({
            email: email,
            password: password
          });

          // Fetch current user details from Catalyst session
          const userDetails = await catalyst.auth.getCurrentUser();
          
          onLogin({
            name: `${userDetails.first_name} ${userDetails.last_name}`.trim() || 'KSP Officer',
            badgeNumber: badgeNumber,
            role: userDetails.role_details?.role_name || 'Investigator',
            station: 'Bengaluru Command Center'
          });
          setLoading(false);
          return;
        } catch (authErr: any) {
          console.warn('Zoho Catalyst auth failed, trying local mockup fallback:', authErr);
        }
      }

      // Local mockup authentication fallback
      const res = await api.login(badgeNumber, password);
      setLoading(false);
      if (res.success && res.user) {
        onLogin(res.user);
      } else {
        setError(res.message || 'Invalid credentials.');
      }
    } catch (err) {
      setLoading(false);
      setError('Connection to KSP authentication services failed.');
    }
  };


  return (
    <div className="login-container">
      <div className="login-card">
        {/* Left Side: Brand Panel */}
        <div className="login-brand-side">
          <img src="/Main-logo.png" alt="DRISHTI Logo" className="login-logo" />
          <p className="login-subtitle">Karnataka State Police &mdash; Crime Analytics Portal</p>
          <div className="login-badge">Secure Intel Channel &bull; Level 3 Access</div>
          
          <div className="login-brand-meta">
            <p>Restricted access for authorized KSP personnel only.</p>
            <p style={{ marginTop: '6px' }}>Terminal IP: 10.142.0.84</p>
            <p style={{ marginTop: '4px' }}>Federal Session Node: IN-GP-04</p>
          </div>
        </div>

        {/* Right Side: Form Panel */}
        <div className="login-form-side">
          <h2 className="login-form-title">Security Authentication</h2>
          <p className="login-form-subtitle">Enter your KSP credentials to access the intelligence console.</p>

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

        </div>
      </div>
    </div>
  );
}
