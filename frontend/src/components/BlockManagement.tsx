import { useState, useEffect, useCallback } from 'react';
import { groupsApi } from '../api/groups';
import type { RentalGroup, Renter, CreateRenter } from '../types/group';
import { useLanguage } from '../i18n/LanguageContext';
import { GroupFormModal } from './GroupFormModal';
import { RenterFormModal } from './RenterFormModal';

export function BlockManagement() {
  const { t } = useLanguage();
  const [groups, setGroups] = useState<RentalGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [renters, setRenters] = useState<Renter[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<RentalGroup | null>(null);
  const [renterModalOpen, setRenterModalOpen] = useState(false);
  const [editingRenter, setEditingRenter] = useState<Renter | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  const loadGroups = useCallback(async () => {
    try { setGroups(await groupsApi.getGroups()); } catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
  }, []);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  const loadRenters = useCallback(async () => {
    if (!selectedGroupId) { setRenters([]); return; }
    setLoading(true);
    try { setRenters(await groupsApi.getRenters(selectedGroupId)); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed'); }
    finally { setLoading(false); }
  }, [selectedGroupId]);

  useEffect(() => { loadRenters(); }, [loadRenters]);

  const selectedGroup = groups.find(g => g.id === selectedGroupId) || null;

  const handleGroupSubmit = async (name: string, id?: string) => {
    if (id) await groupsApi.updateGroup(id, { name }); else await groupsApi.createGroup({ name });
    setGroupModalOpen(false); setEditingGroup(null); await loadGroups();
  };
  const handleDeleteGroup = async (id: string) => {
    await groupsApi.deleteGroup(id);
    if (selectedGroupId === id) { setSelectedGroupId(null); setRenters([]); }
    setConfirmDelete(null); await loadGroups();
  };
  const handleRenterSubmit = async (data: CreateRenter & { id?: string }) => {
    if (!selectedGroupId) return;
    if (data.id) await groupsApi.updateRenter(selectedGroupId, data.id, { name: data.name, phoneNumber: data.phoneNumber, rentPrice: data.rentPrice });
    else await groupsApi.addRenter(selectedGroupId, { name: data.name, phoneNumber: data.phoneNumber, rentPrice: data.rentPrice });
    setRenterModalOpen(false); setEditingRenter(null); await loadRenters(); await loadGroups();
  };
  const handleDeleteRenter = async (id: string) => {
    if (!selectedGroupId || !confirm(t.deleteRenterConfirm)) return;
    await groupsApi.deleteRenter(selectedGroupId, id); await loadRenters(); await loadGroups();
  };

  return (
    <div className="page-content">
      <h2 className="page-title">{t.blockManagementTitle}</h2>
      {error && <div className="error-banner" role="alert">{error} <button className="dismiss-btn" onClick={() => setError(null)}>{t.dismiss}</button></div>}

      <div className="bm-layout">
        <div className="bm-sidebar card">
          <div className="card-section-header">
            <h3>{t.blocks}</h3>
            <button className="btn btn-primary btn-sm" onClick={() => { setEditingGroup(null); setGroupModalOpen(true); }}>{t.addBlock}</button>
          </div>
          <ul className="group-list">
            {groups.length === 0 && <li className="group-empty">{t.noBlocksYet}</li>}
            {groups.map(g => (
              <li key={g.id} className={`group-item${selectedGroupId === g.id ? ' group-item--active' : ''}`} onClick={() => setSelectedGroupId(g.id)}>
                <div className="group-item-info">
                  <span className="group-item-name">{g.name}</span>
                  <span className="group-item-count">{g.renterCount} {g.renterCount !== 1 ? t.renters : t.renter}</span>
                </div>
                <div className="group-item-actions" onClick={e => e.stopPropagation()}>
                  <button className="btn-icon" title={t.edit} onClick={() => { setEditingGroup(g); setGroupModalOpen(true); }}>&#9998;</button>
                  {confirmDelete === g.id ? (
                    <>
                      <button className="btn-icon btn-icon--danger" onClick={() => handleDeleteGroup(g.id)}>&#10003;</button>
                      <button className="btn-icon" onClick={() => setConfirmDelete(null)}>&#10007;</button>
                    </>
                  ) : (
                    <button className="btn-icon btn-icon--danger" onClick={() => setConfirmDelete(g.id)}>&#128465;</button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="bm-main card">
          {selectedGroup ? (
            <>
              <div className="card-section-header">
                <div>
                  <h3>{selectedGroup.name} — {t.rentersLabel}</h3>
                  <span className="text-muted">{renters.length} {renters.length !== 1 ? t.renters : t.renter}</span>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => { setEditingRenter(null); setRenterModalOpen(true); }}>{t.addRenter}</button>
              </div>
              {loading ? <p className="empty-state-inline">{t.loading}</p> : renters.length === 0 ? (
                <p className="empty-state-inline">{t.noRentersYet}</p>
              ) : (
                <div className="renter-table-wrap">
                  <table className="renter-table">
                    <thead><tr><th>{t.name}</th><th>{t.phone}</th><th>{t.rentPrice}</th><th>{t.actions}</th></tr></thead>
                    <tbody>
                      {renters.map(r => (
                        <tr key={r.id}>
                          <td className="renter-name">{r.name}</td>
                          <td>{r.phoneNumber || '\u2014'}</td>
                          <td className="renter-price">${Number(r.rentPrice).toLocaleString()}</td>
                          <td>
                            <div className="renter-actions">
                              <button className="btn btn-ghost btn-sm" onClick={() => { setEditingRenter(r); setRenterModalOpen(true); }}>{t.edit}</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteRenter(r.id)}>{t.delete}</button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          ) : (
            <p className="empty-state-inline">{t.selectBlockToManage}</p>
          )}
        </div>
      </div>

      {groupModalOpen && <GroupFormModal group={editingGroup} onClose={() => { setGroupModalOpen(false); setEditingGroup(null); }} onSubmit={handleGroupSubmit} />}
      {renterModalOpen && <RenterFormModal renter={editingRenter} onClose={() => { setRenterModalOpen(false); setEditingRenter(null); }} onSubmit={handleRenterSubmit} />}
    </div>
  );
}
