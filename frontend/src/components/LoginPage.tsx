import { useState, useEffect } from 'react';
import { login, setStoredAuth, checkDbStatus, type LoginResponse } from '../api/auth';
import './LoginPage.css';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [userName, setUserName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dbStatus, setDbStatus] = useState<{ db: 'checking' | 'online' | 'offline'; rentalsTableOk: boolean }>({ db: 'checking', rentalsTableOk: false });

  useEffect(() => {
    checkDbStatus().then((s) => setDbStatus({ db: s.dbConnection, rentalsTableOk: s.rentalsTableOk }));
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const data: LoginResponse = await login(userName, password);
      setStoredAuth(data.token, data.userName);
      onLogin();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <h1 className="login-title">House Rental Manager</h1>
        <p className="login-subtitle">Sign in to continue</p>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && (
            <div className="login-error" role="alert">
              {error}
            </div>
          )}
          <div className="login-field">
            <label htmlFor="login-username">Username</label>
            <input
              id="login-username"
              type="text"
              autoComplete="username"
              value={userName}
              onChange={(e) => setUserName(e.target.value)}
              placeholder="Enter username"
              required
              disabled={loading}
            />
          </div>
          <div className="login-field">
            <label htmlFor="login-password">Password</label>
            <input
              id="login-password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
              disabled={loading}
            />
          </div>
          <button
            type="submit"
            className="btn btn-primary login-submit"
            disabled={loading}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>

        <p className="login-hint">
          Default: <strong>admin</strong> / <strong>admin123</strong>
        </p>
        <p className={`login-db-status db-${dbStatus.db}`} aria-live="polite">
          DB connection: {dbStatus.db === 'checking' ? '…' : dbStatus.db === 'online' ? 'online' : 'offline'}
          {dbStatus.db === 'online' && (
            <> · Rentals table: {dbStatus.rentalsTableOk ? 'ok' : <span className="db-offline">missing — restart the API</span>}</>
          )}
        </p>
      </div>
    </div>
  );
}
