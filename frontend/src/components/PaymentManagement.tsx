import { useState, useEffect, useCallback } from 'react';
import { groupsApi } from '../api/groups';
import type { RentalGroup, RenterPayments, PaymentItem } from '../types/group';
import { useLanguage } from '../i18n/LanguageContext';
import { generateReceipt } from '../utils/receipt';

const now = new Date();

export function PaymentManagement() {
  const { t } = useLanguage();
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

  const togglePaid = async (renterId: string, type: string, currentItem: PaymentItem, rentPrice: number) => {
    if (!selectedGroupId) return;
    const amount = type === 'rent' ? rentPrice : currentItem.amount;
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
    const amount = type === 'rent' && item.amount === 0 ? rp.rentPrice : item.amount;
    generateReceipt({ name: rp.name, phoneNumber: rp.phoneNumber, rentPrice: rp.rentPrice, id: rp.renterId }, selectedGroup?.name || '', month, year, type, amount);
  };

  const billModalTitle = editingBill?.type === 'electricity' ? t.enterElecBillAmount : t.enterWaterBillAmount;

  return (
    <div className="page-content">
      <h2 className="page-title">{t.paymentManagementTitle}</h2>
      {error && <div className="error-banner" role="alert">{error} <button className="dismiss-btn" onClick={() => setError(null)}>{t.dismiss}</button></div>}

      <div className="pm-controls card">
        <div className="pm-control-group">
          <label>{t.blockLabel}</label>
          <select value={selectedGroupId || ''} onChange={e => setSelectedGroupId(e.target.value || null)}>
            <option value="">{t.selectBlock}</option>
            {groups.map(g => <option key={g.id} value={g.id}>{g.name}</option>)}
          </select>
        </div>
        <div className="pm-control-group">
          <label>{t.monthLabel}</label>
          <select value={month} onChange={e => setMonth(Number(e.target.value))}>
            {t.months.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
          </select>
        </div>
        <div className="pm-control-group">
          <label>{t.yearLabel}</label>
          <select value={year} onChange={e => setYear(Number(e.target.value))}>
            {years.map(y => <option key={y} value={y}>{y}</option>)}
          </select>
        </div>
      </div>

      {!selectedGroupId ? (
        <div className="empty-state">{t.selectBlockToManage2}</div>
      ) : loading ? (
        <div className="empty-state">{t.loading}</div>
      ) : payments.length === 0 ? (
        <div className="empty-state">{t.noRentersInBlock}</div>
      ) : (
        <div className="card">
          <div className="card-section-header">
            <h3>{selectedGroup?.name} — {t.months[month - 1]} {year}</h3>
          </div>
          <div className="renter-table-wrap">
            <table className="renter-table payment-table">
              <thead>
                <tr>
                  <th>{t.renterCol}</th>
                  <th className="th-payment">{t.rentCol}</th>
                  <th className="th-payment">{t.electricityCol}</th>
                  <th className="th-payment">{t.waterCol}</th>
                  <th>{t.receiptCol}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(rp => (
                  <tr key={rp.renterId}>
                    <td>
                      <div className="renter-name">{rp.name}</div>
                      <div className="text-muted text-sm">${Number(rp.rentPrice).toLocaleString()}{t.perMonth}</div>
                    </td>
                    {(['rent', 'electricity', 'water'] as const).map(type => {
                      const item = rp[type];
                      return (
                        <td key={type} className="td-payment">
                          <button
                            className={`badge-toggle ${item.isPaid ? 'badge-toggle--paid' : 'badge-toggle--unpaid'}`}
                            onClick={() => togglePaid(rp.renterId, type, item, rp.rentPrice)}
                          >
                            {item.isPaid ? t.paid : t.unpaid}
                          </button>
                          {item.isPaid && item.amount > 0 && (
                            <span className="payment-amount">${Number(item.amount).toLocaleString()}</span>
                          )}
                        </td>
                      );
                    })}
                    <td>
                      <div className="receipt-buttons">
                        {rp.rent.isPaid && <button className="btn-receipt" onClick={() => handleReceipt(rp, 'rent', rp.rent)} title={t.typeRent}>{t.rentReceipt}</button>}
                        {rp.electricity.isPaid && <button className="btn-receipt" onClick={() => handleReceipt(rp, 'electricity', rp.electricity)} title={t.typeElectricity}>{t.elecReceipt}</button>}
                        {rp.water.isPaid && <button className="btn-receipt" onClick={() => handleReceipt(rp, 'water', rp.water)} title={t.typeWater}>{t.waterReceipt}</button>}
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

      {editingBill && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setEditingBill(null)}>
          <div className="modal">
            <div className="modal-header">
              <h2>{billModalTitle}</h2>
              <button className="btn-close" onClick={() => setEditingBill(null)}>&times;</button>
            </div>
            <form className="modal-form" onSubmit={e => { e.preventDefault(); submitBillAmount(); }}>
              <div className="field">
                <label>{t.amountDollar}</label>
                <input type="number" min={0} step={0.01} value={editingBill.amount} onChange={e => setEditingBill({ ...editingBill, amount: e.target.value })} autoFocus required placeholder="0.00" />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-ghost" onClick={() => setEditingBill(null)}>{t.cancel}</button>
                <button type="submit" className="btn btn-primary">{t.markAsPaid}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
