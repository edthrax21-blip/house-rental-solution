import { useState, useEffect, useCallback } from 'react';
import { groupsApi } from '../api/groups';
import type { RentalGroup, RenterPayments, PaymentItem } from '../types/group';
import { generateReceipt } from '../utils/receipt';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const now = new Date();

export function PaymentManagement() {
  const [groups, setGroups] = useState<RentalGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [payments, setPayments] = useState<RenterPayments[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingBill, setEditingBill] = useState<{ renterId: string; type: string; amount: string } | null>(null);

  useEffect(() => { groupsApi.getGroups().then(setGroups).catch(() => {}); }, []);

  const loadPayments = useCallback(async () => {
    if (!selectedGroupId) { setPayments([]); return; }
    setLoading(true);
    try { setPayments(await groupsApi.getPayments(selectedGroupId, month, year)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [selectedGroupId, month, year]);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const togglePaid = async (renterId: string, type: string, currentItem: PaymentItem) => {
    if (!selectedGroupId) return;
    const amount = currentItem.amount;
    if (!currentItem.isPaid && (type === 'electricity' || type === 'water') && amount === 0) {
      setEditingBill({ renterId, type, amount: '' });
      return;
    }
    await groupsApi.setPayment(selectedGroupId, renterId, { month, year, type, amount, isPaid: !currentItem.isPaid });
    await loadPayments();
  };

  const submitBillAmount = async () => {
    if (!editingBill || !selectedGroupId) return;
    const amount = parseFloat(editingBill.amount);
    if (isNaN(amount) || amount < 0) return;
    await groupsApi.setPayment(selectedGroupId, editingBill.renterId, { month, year, type: editingBill.type, amount, isPaid: true });
    setEditingBill(null);
    await loadPayments();
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const currentYear = now.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const handleReceipt = (rp: RenterPayments, type: string, item: PaymentItem) => {
    if (!item.isPaid) return;
    generateReceipt({ name: rp.name, phoneNumber: rp.phoneNumber, rentPrice: rp.rentPrice, id: rp.renterId }, selectedGroup?.name || '', month, year, type, item.amount);
  };

  return (
    <div className="page-content">
      <h2 className="page-title">Payment Management</h2>
      {error && <div className="error-banner" role="alert">{error} <button className="dismiss-btn" onClick={() => setError(null)}>Dismiss</button></div>}

      {/* Controls row */}
      <div className="pm-controls card">
        <div className="pm-control-group">
          <label>Block:</label>
          <select value={selectedGroupId || ''} onChange={e => setSelectedGroupId(e.target.value || null)}>
            <option value="">-- Select Block --</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="pm-control-group">
          <label>Month:</label>
          <select value={month} onChange={e => setMonth(Number(e.target.value))}>
            {MONTH_NAMES.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className="pm-control-group">
          <label>Year:</label>
          <select value={year} onChange={e => setYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {/* Payment table */}
      {!selectedGroupId ? (
        <div className="empty-state">Select a block to manage payments.</div>
      ) : loading ? (
        <div className="empty-state">Loading...</div>
      ) : payments.length === 0 ? (
        <div className="empty-state">No renters in this block. Add renters in Block Management first.</div>
      ) : (
        <div className="card">
          <div className="card-section-header">
            <h3>{selectedGroup?.name} — {MONTH_NAMES[month - 1]} {year}</h3>
          </div>
          <div className="renter-table-wrap">
            <table className="renter-table payment-table">
              <thead>
                <tr>
                  <th>Renter</th>
                  <th className="th-payment">Rent</th>
                  <th className="th-payment">Electricity</th>
                  <th className="th-payment">Water</th>
                  <th>Receipt</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(rp => (
                  <tr key={rp.renterId}>
                    <td>
                      <div className="renter-name">{rp.name}</div>
                      <div className="text-muted text-sm">${Number(rp.rentPrice).toLocaleString()}/mo</div>
                    </td>
                    {(['rent', 'electricity', 'water'] as const).map(type => {
                      const item = rp[type];
                      return (
                        <td key={type} className="td-payment">
                          <button
                            className={`badge-toggle ${item.isPaid ? 'badge-toggle--paid' : 'badge-toggle--unpaid'}`}
                            onClick={() => togglePaid(rp.renterId, type, item)}
                          >
                            {item.isPaid ? 'Paid' : 'Unpaid'}
                          </button>
                          {item.isPaid && item.amount > 0 && (
                            <span className="payment-amount">${Number(item.amount).toLocaleString()}</span>
                          )}
                        </td>
                      );
                    })}
                    <td>
                      <div className="receipt-buttons">
                        {rp.rent.isPaid && <button className="btn-receipt" onClick={() => handleReceipt(rp, 'rent', rp.rent)} title="Rent receipt">Rent</button>}
                        {rp.electricity.isPaid && <button className="btn-receipt" onClick={() => handleReceipt(rp, 'electricity', rp.electricity)} title="Electricity receipt">Elec</button>}
                        {rp.water.isPaid && <button className="btn-receipt" onClick={() => handleReceipt(rp, 'water', rp.water)} title="Water receipt">Water</button>}
                        {!rp.rent.isPaid && !rp.electricity.isPaid && !rp.water.isPaid && <span className="text-muted">&mdash;</span>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Bill amount modal */}
      {editingBill && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditingBill(null)}>
          <div className="modal">
            <div className="modal-header">
              <h2>Enter {editingBill.type === 'electricity' ? 'Electricity' : 'Water'} Bill Amount</h2>
              <button className="btn-close" onClick={() => setEditingBill(null)}>&times;</button>
            </div>
            <form className="modal-form" onSubmit={e => { e.preventDefault(); submitBillAmount(); }}>
              <div className="field">
                <label>Amount ($)</label>
                <input type="number" min={0} step={0.01} value={editingBill.amount} onChange={e => setEditingBill({ ...editingBill, amount: e.target.value })} autoFocus required placeholder="0.00" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setEditingBill(null)}>Cancel</button>
                <button type="submit" className="btn btn-primary">Mark as Paid</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
