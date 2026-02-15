import { useState } from 'react';
import type { RentalGroup, GroupSummary, MonthlyRecord } from '../types/group';

const MONTH_NAMES = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

interface SidebarProps {
  groups: RentalGroup[];
  selectedGroupId: string | null;
  summary: GroupSummary | null;
  monthlyRecords: MonthlyRecord[];
  onSelectGroup: (id: string) => void;
  onAddGroup: () => void;
  onEditGroup: (group: RentalGroup) => void;
  onDeleteGroup: (id: string) => void;
}

export function Sidebar({
  groups, selectedGroupId, summary, monthlyRecords,
  onSelectGroup, onAddGroup, onEditGroup, onDeleteGroup,
}: SidebarProps) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <aside className="sidebar">
      {/* Blocks list */}
      <div className="sidebar-section">
        <div className="sidebar-section-header">
          <h3>Blocks</h3>
          <button type="button" className="btn btn-primary btn-sm" onClick={onAddGroup}>+ Add</button>
        </div>
        <ul className="group-list">
          {groups.length === 0 && <li className="group-empty">No blocks yet</li>}
          {groups.map(g => (
            <li
              key={g.id}
              className={`group-item${selectedGroupId === g.id ? ' group-item--active' : ''}`}
              onClick={() => onSelectGroup(g.id)}
            >
              <div className="group-item-info">
                <span className="group-item-name">{g.name}</span>
                <span className="group-item-count">{g.renterCount} renter{g.renterCount !== 1 ? 's' : ''}</span>
              </div>
              <div className="group-item-actions" onClick={e => e.stopPropagation()}>
                <button type="button" className="btn-icon" title="Edit" onClick={() => onEditGroup(g)}>&#9998;</button>
                {confirmDelete === g.id ? (
                  <>
                    <button type="button" className="btn-icon btn-icon--danger" title="Confirm" onClick={() => { onDeleteGroup(g.id); setConfirmDelete(null); }}>&#10003;</button>
                    <button type="button" className="btn-icon" title="Cancel" onClick={() => setConfirmDelete(null)}>&#10007;</button>
                  </>
                ) : (
                  <button type="button" className="btn-icon btn-icon--danger" title="Delete" onClick={() => setConfirmDelete(g.id)}>&#128465;</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* Monthly summary */}
      {summary && (
        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <h3>Summary</h3>
          </div>
          <div className="summary-card">
            <h4 className="summary-title">{summary.groupName}</h4>
            <p className="summary-period">{MONTH_NAMES[summary.month - 1]} {summary.year}</p>
            <div className="summary-grid">
              <div className="summary-stat">
                <span className="summary-stat-value">{summary.totalRenters}</span>
                <span className="summary-stat-label">Total Renters</span>
              </div>
              <div className="summary-stat">
                <span className="summary-stat-value">${Number(summary.totalRentPrice).toLocaleString()}</span>
                <span className="summary-stat-label">Total Rent</span>
              </div>
              <div className="summary-stat summary-stat--success">
                <span className="summary-stat-value">{summary.paidRenters}</span>
                <span className="summary-stat-label">Paid</span>
              </div>
              <div className="summary-stat summary-stat--success">
                <span className="summary-stat-value">${Number(summary.totalPaidAmount).toLocaleString()}</span>
                <span className="summary-stat-label">Collected</span>
              </div>
              <div className="summary-stat summary-stat--danger">
                <span className="summary-stat-value">{summary.unpaidRenters}</span>
                <span className="summary-stat-label">Unpaid</span>
              </div>
              <div className="summary-stat summary-stat--danger">
                <span className="summary-stat-value">${Number(summary.totalUnpaidAmount).toLocaleString()}</span>
                <span className="summary-stat-label">Outstanding</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Payment history (for audit) */}
      {monthlyRecords.length > 0 && (
        <div className="sidebar-section">
          <div className="sidebar-section-header">
            <h3>Payment History</h3>
          </div>
          <div className="history-list">
            {monthlyRecords.map(rec => (
              <div key={`${rec.year}-${rec.month}`} className="history-item">
                <span className="history-period">{MONTH_NAMES[rec.month - 1]} {rec.year}</span>
                <div className="history-badges">
                  <span className="history-badge history-badge--paid">{rec.paidCount} paid</span>
                  {rec.unpaidCount > 0 && <span className="history-badge history-badge--unpaid">{rec.unpaidCount} unpaid</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </aside>
  );
}
