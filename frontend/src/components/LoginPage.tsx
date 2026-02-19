import { useState, useEffect } from 'react';
import { login, setStoredAuth, checkDbStatus, type LoginResponse } from '../api/auth';
import { useLanguage } from '../i18n/LanguageContext';
import type { Lang } from '../i18n/translations';
import './LoginPage.css';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const { lang, setLang, t } = useLanguage();
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
        <div className="login-lang-row">
          <select className="lang-select" value={lang} onChange={e => setLang(e.target.value as Lang)}>
            <option value="en">English</option>
            <option value="ms">Bahasa Melayu</option>
          </select>
        </div>
        <h1 className="login-title">{t.appName}</h1>
        <p className="login-subtitle">{t.signInSubtitle}</p>

        <form className="login-form" onSubmit={handleSubmit}>
          {error && <div className="login-error" role="alert">{error}</div>}
          <div className="login-field">
            <label htmlFor="login-username">{t.username}</label>
            <input id="login-username" type="text" autoComplete="username" value={userName} onChange={(e) => setUserName(e.target.value)} placeholder={t.enterUsername} required disabled={loading} />
          </div>
          <div className="login-field">
            <label htmlFor="login-password">{t.password}</label>
            <input id="login-password" type="password" autoComplete="current-password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={t.enterPassword} required disabled={loading} />
          </div>
          <button type="submit" className="btn btn-primary login-submit" disabled={loading}>
            {loading ? t.signingIn : t.signIn}
          </button>
        </form>

        <p className="login-hint">
          {t.loginDefault} <strong>admin</strong> / <strong>admin123</strong>
        </p>
        <p className={`login-db-status db-${dbStatus.db}`} aria-live="polite">
          {t.dbConnection} {dbStatus.db === 'checking' ? t.checking : dbStatus.db === 'online' ? t.online : t.offline}
          {dbStatus.db === 'online' && (
            <> · {t.rentalsTable} {dbStatus.rentalsTableOk ? t.ok : <span className="db-offline">{t.missingRestartApi}</span>}</>
          )}
        </p>
      </div>
    </div>
  );
}
