import { useState, useEffect, useCallback } from 'react';
import { groupsApi } from '../api/groups';
import type { RentalGroup, Renter, CreateRenter } from '../types/group';
import { GroupFormModal } from './GroupFormModal';
import { RenterFormModal } from './RenterFormModal';

export function BlockManagement() {
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
    if (!selectedGroupId || !confirm('Delete this renter?')) return;
    await groupsApi.deleteRenter(selectedGroupId, id); await loadRenters(); await loadGroups();
  };

  return (
    <div className="page-content">
      <h2 className="page-title">Block / Renter Management</h2>
      {error && <div className="error-banner" role="alert">{error} <button className="dismiss-btn" onClick={() => setError(null)}>Dismiss</button></div>}

      <div className="bm-layout">
        {/* Block list */}
        <div className="bm-sidebar card">
          <div className="card-section-header">
            <h3>Blocks</h3>
            <button className="btn btn-primary btn-sm" onClick={() => { setEditingGroup(null); setGroupModalOpen(true); }}>+ Add Block</button>
          </div>
          <ul className="group-list">
            {groups.length === 0 && <li className="group-empty">No blocks yet</li>}
            {groups.map(g => (
              <li key={g.id} className={`group-item${selectedGroupId === g.id ? ' group-item--active' : ''}`} onClick={() => setSelectedGroupId(g.id)}>
                <div className="group-item-info">
                  <span className="group-item-name">{g.name}</span>
                  <span className="group-item-count">{g.renterCount} renter{g.renterCount !== 1 ? 's' : ''}</span>
                </div>
                <div className="group-item-actions" onClick={e => e.stopPropagation()}>
                  <button className="btn-icon" title="Edit" onClick={() => { setEditingGroup(g); setGroupModalOpen(true); }}>&#9998;</button>
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

        {/* Renter list */}
        <div className="bm-main card">
          {selectedGroup ? (
            <>
              <div className="card-section-header">
                <div>
                  <h3>{selectedGroup.name} — Renters</h3>
                  <span className="text-muted">{renters.length} renter{renters.length !== 1 ? 's' : ''}</span>
                </div>
                <button className="btn btn-primary btn-sm" onClick={() => { setEditingRenter(null); setRenterModalOpen(true); }}>+ Add Renter</button>
              </div>
              {loading ? <p className="empty-state-inline">Loading...</p> : renters.length === 0 ? (
                <p className="empty-state-inline">No renters yet. Click "+ Add Renter" to get started.</p>
              ) : (
                <div className="renter-table-wrap">
                  <table className="renter-table">
                    <thead><tr><th>Name</th><th>Phone</th><th>Rent Price</th><th>Actions</th></tr></thead>
                    <tbody>
                      {renters.map(r => (
                        <tr key={r.id}>
                          <td className="renter-name">{r.name}</td>
                          <td>{r.phoneNumber || '\u2014'}</td>
                          <td className="renter-price">${Number(r.rentPrice).toLocaleString()}</td>
                          <td>
                            <div className="renter-actions">
                              <button className="btn btn-ghost btn-sm" onClick={() => { setEditingRenter(r); setRenterModalOpen(true); }}>Edit</button>
                              <button className="btn btn-danger btn-sm" onClick={() => handleDeleteRenter(r.id)}>Delete</button>
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
            <p className="empty-state-inline">Select a block to manage its renters.</p>
          )}
        </div>
      </div>

      {groupModalOpen && <GroupFormModal group={editingGroup} onClose={() => { setGroupModalOpen(false); setEditingGroup(null); }} onSubmit={handleGroupSubmit} />}
      {renterModalOpen && <RenterFormModal renter={editingRenter} onClose={() => { setRenterModalOpen(false); setEditingRenter(null); }} onSubmit={handleRenterSubmit} />}
    </div>
  );
}
