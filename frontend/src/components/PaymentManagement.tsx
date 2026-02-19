import { useState, useEffect, useCallback } from 'react';
import { groupsApi, whatsAppApi, receiptsApi } from '../api/groups';
import type { RentalGroup, RenterPayments } from '../types/group';
import { useLanguage } from '../i18n/LanguageContext';
import { generateReceipt, sendWhatsAppReceipt, buildWhatsAppMsg, buildReceiptBlob } from '../utils/receipt';
import type { PaymentBreakdown } from '../utils/receipt';

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
  const [twilioConfigured, setTwilioConfigured] = useState(false);
  const [sendingWa, setSendingWa] = useState<string | null>(null);

  // Local editable bill amounts keyed by renterId
  const [elecInputs, setElecInputs] = useState<Record<string, string>>({});
  const [waterInputs, setWaterInputs] = useState<Record<string, string>>({});

  useEffect(() => {
    groupsApi.getGroups().then(setGroups).catch(() => {});
    whatsAppApi.getStatus().then(s => setTwilioConfigured(s.configured)).catch(() => {});
  }, []);

  const loadPayments = useCallback(async () => {
    if (!selectedGroupId) { setPayments([]); return; }
    setLoading(true);
    try {
      const data = await groupsApi.getPayments(selectedGroupId, month, year);
      setPayments(data);
      const elec: Record<string, string> = {};
      const water: Record<string, string> = {};
      data.forEach(rp => {
        elec[rp.renterId] = rp.electricityAmount > 0 ? String(rp.electricityAmount) : '';
        water[rp.renterId] = rp.waterAmount > 0 ? String(rp.waterAmount) : '';
      });
      setElecInputs(elec);
      setWaterInputs(water);
    } catch (e) { setError(e instanceof Error ? e.message : 'Failed to load'); }
    finally { setLoading(false); }
  }, [selectedGroupId, month, year]);

  useEffect(() => { loadPayments(); }, [loadPayments]);

  const saveBills = async (renterId: string) => {
    if (!selectedGroupId) return;
    const elec = parseFloat(elecInputs[renterId] || '0') || 0;
    const water = parseFloat(waterInputs[renterId] || '0') || 0;
    await groupsApi.updateBills(selectedGroupId, renterId, { month, year, electricityAmount: elec, waterAmount: water });
    await loadPayments();
  };

  const togglePaid = async (rp: RenterPayments) => {
    if (!selectedGroupId) return;
    await groupsApi.togglePaid(selectedGroupId, rp.renterId, { month, year, isPaid: !rp.isPaid });
    await loadPayments();
  };

  const getBreakdown = (rp: RenterPayments): PaymentBreakdown => ({
    rentAmount: rp.rentAmount,
    electricityAmount: rp.electricityAmount,
    waterAmount: rp.waterAmount,
    totalAmount: rp.totalAmount,
  });

  const handleReceipt = (rp: RenterPayments) => {
    if (!rp.isPaid) return;
    const renterInfo = { name: rp.name, phoneNumber: rp.phoneNumber, rentPrice: rp.rentPrice, id: rp.renterId };
    generateReceipt(renterInfo, selectedGroup?.name || '', month, year, getBreakdown(rp));
  };

  const handleWhatsApp = async (rp: RenterPayments) => {
    if (!rp.isPaid) return;
    const renterInfo = { name: rp.name, phoneNumber: rp.phoneNumber, rentPrice: rp.rentPrice, id: rp.renterId };
    const groupName = selectedGroup?.name || '';
    const breakdown = getBreakdown(rp);

    setSendingWa(rp.renterId);
    try {
      const { blob, fileName } = buildReceiptBlob(renterInfo, groupName, month, year, breakdown);
      const { downloadUrl } = await receiptsApi.upload(blob, fileName);

      if (twilioConfigured) {
        const message = buildWhatsAppMsg(renterInfo, groupName, month, year, breakdown, downloadUrl);
        const result = await whatsAppApi.sendReceipt(rp.phoneNumber, message, rp.renterId, month, year);
        alert(t.waSentSuccess);
        setPayments(prev => prev.map(p =>
          p.renterId === rp.renterId ? { ...p, whatsAppSentAt: result.whatsAppSentAt || new Date().toISOString() } : p
        ));
      } else {
        await sendWhatsAppReceipt(renterInfo, groupName, month, year, breakdown, downloadUrl);
      }
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Failed to send');
    } finally {
      setSendingWa(null);
    }
  };

  const selectedGroup = groups.find(g => g.id === selectedGroupId);
  const currentYear = now.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const computeTotal = (rp: RenterPayments, renterId: string) => {
    const elec = parseFloat(elecInputs[renterId] || '0') || 0;
    const water = parseFloat(waterInputs[renterId] || '0') || 0;
    return rp.rentAmount + elec + water;
  };

  const fmtDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' +
      d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

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
                  <th className="th-payment">{t.totalRentAmountCol}</th>
                  <th className="th-payment">{t.statusCol}</th>
                  <th>{t.receiptCol}</th>
                  <th>WhatsApp</th>
                  <th>{t.waStatusCol}</th>
                </tr>
              </thead>
              <tbody>
                {payments.map(rp => (
                  <tr key={rp.renterId}>
                    <td>
                      <div className="renter-name">{rp.name}</div>
                      <div className="text-muted text-sm">{rp.phoneNumber || '—'}</div>
                    </td>
                    <td className="td-payment">
                      <span className="payment-amount-main">${Number(rp.rentAmount).toLocaleString()}</span>
                    </td>
                    <td className="td-payment">
                      <div className="bill-input-group">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          className="bill-input"
                          placeholder="0.00"
                          value={elecInputs[rp.renterId] ?? ''}
                          onChange={e => setElecInputs(prev => ({ ...prev, [rp.renterId]: e.target.value }))}
                          onBlur={() => saveBills(rp.renterId)}
                        />
                      </div>
                    </td>
                    <td className="td-payment">
                      <div className="bill-input-group">
                        <input
                          type="number"
                          min={0}
                          step={0.01}
                          className="bill-input"
                          placeholder="0.00"
                          value={waterInputs[rp.renterId] ?? ''}
                          onChange={e => setWaterInputs(prev => ({ ...prev, [rp.renterId]: e.target.value }))}
                          onBlur={() => saveBills(rp.renterId)}
                        />
                      </div>
                    </td>
                    <td className="td-payment">
                      <span className="total-amount">${computeTotal(rp, rp.renterId).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                    </td>
                    <td className="td-payment">
                      <button
                        className={`badge-toggle ${rp.isPaid ? 'badge-toggle--paid' : 'badge-toggle--unpaid'}`}
                        onClick={() => togglePaid(rp)}
                      >
                        {rp.isPaid ? t.paid : t.unpaid}
                      </button>
                    </td>
                    <td>
                      {rp.isPaid ? (
                        <button className="btn-receipt" onClick={() => handleReceipt(rp)}>{t.receiptCol}</button>
                      ) : <span className="text-muted">&mdash;</span>}
                    </td>
                    <td>
                      {rp.isPaid ? (
                        <button className="btn-whatsapp" onClick={() => handleWhatsApp(rp)} disabled={sendingWa === rp.renterId}>
                          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/></svg>
                          {sendingWa === rp.renterId ? t.waSending : t.sendWhatsApp}
                        </button>
                      ) : <span className="text-muted">&mdash;</span>}
                    </td>
                    <td className="td-wa-status">
                      {rp.whatsAppSentAt ? (
                        <span className="wa-sent-badge" title={fmtDate(rp.whatsAppSentAt)}>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12"/></svg>
                          {t.waSentAt} {fmtDate(rp.whatsAppSentAt)}
                        </span>
                      ) : (
                        <span className="text-muted text-sm">{t.waNotSent}</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
