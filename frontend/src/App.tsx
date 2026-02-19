import { useState, useEffect } from 'react';
import { getStoredToken, clearStoredAuth, getStoredUserName } from './api/auth';
import { LoginPage } from './components/LoginPage';
import { Dashboard } from './components/Dashboard';
import { BlockManagement } from './components/BlockManagement';
import { PaymentManagement } from './components/PaymentManagement';
import { Reports } from './components/Reports';
import './App.css';

type Page = 'dashboard' | 'blocks' | 'payments' | 'reports';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getStoredToken());
  const [page, setPage] = useState<Page>('dashboard');

  useEffect(() => {
    const handleLogout = () => { clearStoredAuth(); setIsAuthenticated(false); };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="app-shell">
      {/* Top nav */}
      <header className="topnav">
        <button className="topnav-brand" onClick={() => setPage('dashboard')}>House Rental Manager</button>
        <nav className="topnav-links">
          <button className={`topnav-link${page === 'blocks' ? ' topnav-link--active' : ''}`} onClick={() => setPage('blocks')}>Blocks</button>
          <button className={`topnav-link${page === 'payments' ? ' topnav-link--active' : ''}`} onClick={() => setPage('payments')}>Payments</button>
          <button className={`topnav-link${page === 'reports' ? ' topnav-link--active' : ''}`} onClick={() => setPage('reports')}>Reports</button>
        </nav>
        <div className="topnav-right">
          <span className="topnav-user">{getStoredUserName() ?? 'User'}</span>
          <button className="btn btn-ghost btn-sm" onClick={() => { clearStoredAuth(); setIsAuthenticated(false); }}>Log out</button>
        </div>
      </header>

      {/* Page content */}
      <main className="app-main">
        {page === 'dashboard' && <Dashboard onNavigate={setPage} />}
        {page === 'blocks' && <BlockManagement />}
        {page === 'payments' && <PaymentManagement />}
        {page === 'reports' && <Reports />}
      </main>
    </div>
  );
}
