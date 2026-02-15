import type { Renter, RentalGroup } from '../types/group';
import { generateReceipt } from '../utils/receipt';

const MONTH_NAMES = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December',
];

interface RenterPanelProps {
  group: RentalGroup;
  renters: Renter[];
  loading: boolean;
  month: number;
  year: number;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onAddRenter: () => void;
  onEditRenter: (renter: Renter) => void;
  onDeleteRenter: (renterId: string) => void;
  onTogglePaid: (renter: Renter) => void;
}

export function RenterPanel({
  group, renters, loading, month, year,
  onMonthChange, onYearChange, onAddRenter, onEditRenter, onDeleteRenter, onTogglePaid,
}: RenterPanelProps) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  return (
    <div className="renter-panel">
      {/* Header with group name + Add button */}
      <div className="renter-panel-header">
        <div>
          <h2 className="renter-panel-title">{group.name}</h2>
          <p className="renter-panel-subtitle">{renters.length} renter{renters.length !== 1 ? 's' : ''}</p>
        </div>
        <button type="button" className="btn btn-primary" onClick={onAddRenter}>+ Add Renter</button>
      </div>

      {/* Month / Year selector */}
      <div className="month-selector">
        <label className="month-selector-label">Payment Period:</label>
        <select className="month-select" value={month} onChange={e => onMonthChange(Number(e.target.value))}>
          {MONTH_NAMES.map((m, i) => (
            <option key={i + 1} value={i + 1}>{m}</option>
          ))}
        </select>
        <select className="month-select" value={year} onChange={e => onYearChange(Number(e.target.value))}>
          {years.map(y => (
            <option key={y} value={y}>{y}</option>
          ))}
        </select>
      </div>

      {/* Renter table */}
      {loading ? (
        <p className="empty-state" style={{ border: 'none', boxShadow: 'none' }}>Loading...</p>
      ) : renters.length === 0 ? (
        <p className="empty-state" style={{ border: 'none', boxShadow: 'none' }}>No renters in this block yet. Click "+ Add Renter" to get started.</p>
      ) : (
        <div className="renter-table-wrap">
          <table className="renter-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Phone</th>
                <th>Rent Price</th>
                <th>Status</th>
                <th>Receipt</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {renters.map(r => {
                const isPaid = r.payment?.isPaid ?? false;
                return (
                  <tr key={r.id} className={isPaid ? 'renter-row--paid' : ''}>
                    <td className="renter-name">{r.name}</td>
                    <td>{r.phoneNumber || '\u2014'}</td>
                    <td className="renter-price">${Number(r.rentPrice).toLocaleString()}</td>
                    <td>
                      <button
                        type="button"
                        className={`badge-toggle ${isPaid ? 'badge-toggle--paid' : 'badge-toggle--unpaid'}`}
                        onClick={() => onTogglePaid(r)}
                        title={isPaid ? 'Mark as unpaid' : 'Mark as paid'}
                      >
                        {isPaid ? 'Paid' : 'Unpaid'}
                      </button>
                    </td>
                    <td>
                      {isPaid ? (
                        <button
                          type="button"
                          className="btn-receipt"
                          onClick={() => generateReceipt(r, group.name, month, year)}
                          title={`Download PDF receipt for ${MONTH_NAMES[month - 1]} ${year}`}
                        >
                          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ marginRight: '0.35rem' }}>
                            <path d="M8 1v9m0 0L5 7m3 3l3-3M2 11v2a1 1 0 001 1h10a1 1 0 001-1v-2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                          PDF
                        </button>
                      ) : (
                        <span className="receipt-na">&mdash;</span>
                      )}
                    </td>
                    <td>
                      <div className="renter-actions">
                        <button type="button" className="btn btn-ghost btn-sm" onClick={() => onEditRenter(r)}>Edit</button>
                        <button type="button" className="btn btn-danger btn-sm" onClick={() => onDeleteRenter(r.id)}>Delete</button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
