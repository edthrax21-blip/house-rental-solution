import { useState, useEffect, useCallback } from 'react';
import { groupsApi } from '../api/groups';
import type { BlockReport, RenterReport } from '../types/group';

const MONTH_NAMES = ['January','February','March','April','May','June','July','August','September','October','November','December'];
const now = new Date();

export function Reports() {
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

  return (
    <div className="page-content">
      <h2 className="page-title">Reports</h2>

      <div className="pm-controls card">
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

      <h3 className="section-heading">{MONTH_NAMES[month - 1]} {year} — Block Overview</h3>

      {loading ? <div className="empty-state">Loading...</div> : blocks.length === 0 ? (
        <div className="empty-state">No blocks found. Create blocks in Block Management.</div>
      ) : (
        <div className="report-grid">
          {blocks.map(b => (
            <button key={b.groupId} className={`report-block-card card${drillGroup?.id === b.groupId ? ' report-block-card--active' : ''}`} onClick={() => drillDown(b.groupId, b.groupName)}>
              <h4 className="report-block-name">{b.groupName}</h4>
              <div className="report-block-meta">{b.renterCount} renters &middot; ${Number(b.totalRent).toLocaleString()} total rent</div>
              <div className="report-type-grid">
                <div className="report-type">
                  <span className="report-type-label">Rent</span>
                  <span className="report-type-paid">{b.rent.paid} paid</span>
                  {b.rent.unpaid > 0 && <span className="report-type-unpaid">{b.rent.unpaid} unpaid</span>}
                </div>
                <div className="report-type">
                  <span className="report-type-label">Electricity</span>
                  <span className="report-type-paid">{b.electricity.paid} paid</span>
                  {b.electricity.unpaid > 0 && <span className="report-type-unpaid">{b.electricity.unpaid} unpaid</span>}
                </div>
                <div className="report-type">
                  <span className="report-type-label">Water</span>
                  <span className="report-type-paid">{b.water.paid} paid</span>
                  {b.water.unpaid > 0 && <span className="report-type-unpaid">{b.water.unpaid} unpaid</span>}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Drill-down */}
      {drillGroup && (
        <>
          <h3 className="section-heading">{drillGroup.name} — Renter Details</h3>
          {drillLoading ? <div className="empty-state">Loading...</div> : (
            <div className="card">
              <div className="renter-table-wrap">
                <table className="renter-table">
                  <thead>
                    <tr>
                      <th>Renter</th>
                      <th>Rent ({'\u0024'})</th>
                      <th>Rent Status</th>
                      <th>Electricity ({'\u0024'})</th>
                      <th>Elec Status</th>
                      <th>Water ({'\u0024'})</th>
                      <th>Water Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {renterReport.map(r => (
                      <tr key={r.renterId}>
                        <td className="renter-name">{r.name}</td>
                        <td>${Number(r.rent.amount).toLocaleString()}</td>
                        <td><span className={`badge-static ${r.rent.isPaid ? 'badge-static--paid' : 'badge-static--unpaid'}`}>{r.rent.isPaid ? 'Paid' : 'Unpaid'}</span></td>
                        <td>{r.electricity.amount > 0 ? `$${Number(r.electricity.amount).toLocaleString()}` : '\u2014'}</td>
                        <td><span className={`badge-static ${r.electricity.isPaid ? 'badge-static--paid' : 'badge-static--unpaid'}`}>{r.electricity.isPaid ? 'Paid' : 'Unpaid'}</span></td>
                        <td>{r.water.amount > 0 ? `$${Number(r.water.amount).toLocaleString()}` : '\u2014'}</td>
                        <td><span className={`badge-static ${r.water.isPaid ? 'badge-static--paid' : 'badge-static--unpaid'}`}>{r.water.isPaid ? 'Paid' : 'Unpaid'}</span></td>
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
