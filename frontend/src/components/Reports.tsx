import { useState, useEffect, useCallback } from 'react';
import { jsPDF } from 'jspdf';
import { groupsApi } from '../api/groups';
import type { BlockReport, RenterReport } from '../types/group';
import { useLanguage } from '../i18n/LanguageContext';

const now = new Date();

export function Reports() {
  const { t } = useLanguage();
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());
  const [blocks, setBlocks] = useState<BlockReport[]>([]);
  const [drillGroup, setDrillGroup] = useState<{ id: string; name: string } | null>(null);
  const [renterReport, setRenterReport] = useState<RenterReport[]>([]);
  const [loading, setLoading] = useState(false);
  const [drillLoading, setDrillLoading] = useState(false);

  const currentYear = now.getFullYear();
  const years = Array.from({ length: 5 }, (_, i) => currentYear - 2 + i);

  const loadSummary = useCallback(async () => {
    setLoading(true);
    try { setBlocks(await groupsApi.getReportSummary(month, year)); } catch { /* */ }
    finally { setLoading(false); }
  }, [month, year]);

  useEffect(() => { loadSummary(); setDrillGroup(null); }, [loadSummary]);

  const drillDown = async (groupId: string, groupName: string) => {
    setDrillGroup({ id: groupId, name: groupName });
    setDrillLoading(true);
    try { setRenterReport(await groupsApi.getRenterReport(groupId, month, year)); } catch { /* */ }
    finally { setDrillLoading(false); }
  };

  const fmtAmt = (a: number) => a > 0 ? `$${Number(a).toLocaleString('en-US', { minimumFractionDigits: 2 })}` : '\u2014';

  const exportBlockPdf = () => {
    if (!drillGroup || renterReport.length === 0) return;
    const doc = new jsPDF({ orientation: 'landscape' });
    const pw = doc.internal.pageSize.getWidth();
    const period = `${t.months[month - 1]} ${year}`;

    doc.setFillColor(45, 106, 79);
    doc.rect(0, 0, pw, 36, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(`${drillGroup.name} — ${t.reportPaymentReport}`, pw / 2, 16, { align: 'center' });
    doc.setFontSize(12);
    doc.setFont('helvetica', 'normal');
    doc.text(`${t.receiptPeriod} ${period}`, pw / 2, 28, { align: 'center' });

    doc.setTextColor(26, 25, 23);
    let y = 50;

    const cols = [15, 65, 105, 145, 190, 230];
    const headers = [t.renterCol, `${t.rentCol} ($)`, `${t.electricityCol} ($)`, `${t.waterCol} ($)`, `${t.totalRentAmountCol} ($)`, t.statusCol];

    doc.setFontSize(9);
    doc.setFont('helvetica', 'bold');
    doc.setFillColor(245, 243, 240);
    doc.rect(10, y - 5, pw - 20, 10, 'F');
    headers.forEach((h, i) => doc.text(h, cols[i], y + 2));
    y += 12;

    doc.setFont('helvetica', 'normal');

    for (const r of renterReport) {
      if (y > doc.internal.pageSize.getHeight() - 20) { doc.addPage(); y = 20; }
      doc.text(r.name, cols[0], y);
      doc.text(fmtAmt(r.rentAmount), cols[1], y);
      doc.text(fmtAmt(r.electricityAmount), cols[2], y);
      doc.text(fmtAmt(r.waterAmount), cols[3], y);
      doc.setFont('helvetica', 'bold');
      doc.text(fmtAmt(r.totalAmount), cols[4], y);
      doc.setFont('helvetica', 'normal');
      doc.setTextColor(r.isPaid ? 45 : 157, r.isPaid ? 106 : 2, r.isPaid ? 79 : 8);
      doc.text(r.isPaid ? t.paid : t.unpaid, cols[5], y);
      doc.setTextColor(26, 25, 23);
      y += 9;
    }

    y += 8;
    const block = blocks.find(b => b.groupId === drillGroup.id);
    if (block) {
      doc.setDrawColor(45, 106, 79);
      doc.setLineWidth(0.5);
      doc.line(10, y, pw - 10, y);
      y += 10;
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text(t.reportSummary, 15, y);
      y += 8;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.text(`${t.reportTotalRenters} ${block.renterCount}`, 15, y);
      doc.text(`${t.typeRent} ${t.reportCollected} $${Number(block.rent.collectedAmount).toLocaleString()}`, 80, y);
      y += 7;
      doc.text(`${t.typeElectricity} ${t.reportCollected} $${Number(block.electricity.collectedAmount).toLocaleString()}`, 80, y);
      y += 7;
      doc.text(`${t.typeWater} ${t.reportCollected} $${Number(block.water.collectedAmount).toLocaleString()}`, 80, y);
      y += 7;
      doc.setFont('helvetica', 'bold');
      doc.text(`${t.totalRentAmountCol}: $${Number(block.totalCollected).toLocaleString()}`, 80, y);
    }

    doc.setTextColor(130, 130, 130);
    doc.setFontSize(8);
    doc.text(`${t.reportGeneratedOn} ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, pw / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });

    doc.save(`report-${drillGroup.name.replace(/\s+/g, '-').toLowerCase()}-${t.months[month - 1].toLowerCase()}-${year}.pdf`);
  };

  return (
    <div className="page-content">
      <h2 className="page-title">{t.reportsTitle}</h2>

      <div className="pm-controls card">
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

      <h3 className="section-heading">{t.months[month - 1]} {year} — {t.blockOverview}</h3>

      {loading ? <div className="empty-state">{t.loading}</div> : blocks.length === 0 ? (
        <div className="empty-state">{t.noBlocksFound}</div>
      ) : (
        <div className="report-grid">
          {blocks.map(b => (
            <button key={b.groupId} className={`report-block-card card${drillGroup?.id === b.groupId ? ' report-block-card--active' : ''}`} onClick={() => drillDown(b.groupId, b.groupName)}>
              <h4 className="report-block-name">{b.groupName}</h4>
              <div className="report-block-meta">{b.renterCount} {b.renterCount !== 1 ? t.renters : t.renter} &middot; ${Number(b.totalRent).toLocaleString()} {t.totalRent}</div>
              <div className="report-type-grid">
                <div className="report-type">
                  <span className="report-type-label">{t.typeRent}</span>
                  <span className="report-type-paid">{b.rent.paid} {t.paid.toLowerCase()}</span>
                  {b.rent.unpaid > 0 && <span className="report-type-unpaid">{b.rent.unpaid} {t.unpaid.toLowerCase()}</span>}
                </div>
                <div className="report-type">
                  <span className="report-type-label">{t.typeElectricity}</span>
                  <span className="report-type-paid">${Number(b.electricity.collectedAmount).toLocaleString()}</span>
                </div>
                <div className="report-type">
                  <span className="report-type-label">{t.typeWater}</span>
                  <span className="report-type-paid">${Number(b.water.collectedAmount).toLocaleString()}</span>
                </div>
              </div>
              <div className="report-block-total">
                {t.totalRentAmountCol}: <strong>${Number(b.totalCollected).toLocaleString()}</strong>
              </div>
            </button>
          ))}
        </div>
      )}

      {drillGroup && (
        <>
          <div className="drill-header">
            <h3 className="section-heading">{drillGroup.name} — {t.renterDetails}</h3>
            {renterReport.length > 0 && !drillLoading && (
              <button className="btn btn-primary btn-sm" onClick={exportBlockPdf}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '0.35rem' }}>
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
                </svg>
                {t.exportPdf}
              </button>
            )}
          </div>
          {drillLoading ? <div className="empty-state">{t.loading}</div> : (
            <div className="card">
              <div className="renter-table-wrap">
                <table className="renter-table">
                  <thead>
                    <tr>
                      <th>{t.renterCol}</th>
                      <th>{t.rentCol} ($)</th>
                      <th>{t.electricityCol} ($)</th>
                      <th>{t.waterCol} ($)</th>
                      <th>{t.totalRentAmountCol} ($)</th>
                      <th>{t.statusCol}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renterReport.map(r => (
                      <tr key={r.renterId}>
                        <td className="renter-name">{r.name}</td>
                        <td>{fmtAmt(r.rentAmount)}</td>
                        <td>{fmtAmt(r.electricityAmount)}</td>
                        <td>{fmtAmt(r.waterAmount)}</td>
                        <td className="renter-price">{fmtAmt(r.totalAmount)}</td>
                        <td><span className={`badge-static ${r.isPaid ? 'badge-static--paid' : 'badge-static--unpaid'}`}>{r.isPaid ? t.paid : t.unpaid}</span></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
