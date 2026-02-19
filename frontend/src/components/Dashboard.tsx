import { useLanguage } from '../i18n/LanguageContext';

interface DashboardProps {
  onNavigate: (page: 'blocks' | 'payments' | 'reports') => void;
}

export function Dashboard({ onNavigate }: DashboardProps) {
  const { t } = useLanguage();

  const modules = [
    {
      id: 'blocks' as const,
      title: t.moduleBlocks,
      description: t.moduleBlocksDesc,
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
          <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
        </svg>
      ),
    },
    {
      id: 'payments' as const,
      title: t.modulePayments,
      description: t.modulePaymentsDesc,
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="5" width="20" height="14" rx="2" /><line x1="2" y1="10" x2="22" y2="10" />
        </svg>
      ),
    },
    {
      id: 'reports' as const,
      title: t.moduleReports,
      description: t.moduleReportsDesc,
      icon: (
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
        </svg>
      ),
    },
  ];

  return (
    <div className="dashboard">
      <div className="dashboard-header">
        <h2 className="dashboard-title">{t.dashboard}</h2>
        <p className="dashboard-subtitle">{t.dashboardSubtitle}</p>
      </div>
      <div className="dashboard-grid">
        {modules.map(m => (
          <button key={m.id} className="module-card" onClick={() => onNavigate(m.id)}>
            <div className="module-icon">{m.icon}</div>
            <h3 className="module-title">{m.title}</h3>
            <p className="module-desc">{m.description}</p>
          </button>
        ))}
      </div>
    </div>
  );
}
