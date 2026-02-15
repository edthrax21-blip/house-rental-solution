import { useState, useEffect, useCallback } from 'react';
import { getStoredToken, clearStoredAuth, getStoredUserName } from './api/auth';
import { groupsApi } from './api/groups';
import type { RentalGroup, Renter, GroupSummary, MonthlyRecord, CreateRenter } from './types/group';
import { Sidebar } from './components/Sidebar';
import { RenterPanel } from './components/RenterPanel';
import { RenterFormModal } from './components/RenterFormModal';
import { GroupFormModal } from './components/GroupFormModal';
import { LoginPage } from './components/LoginPage';
import './App.css';

const now = new Date();

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getStoredToken());

  // Groups
  const [groups, setGroups] = useState<RentalGroup[]>([]);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);

  // Month/Year
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [year, setYear] = useState(now.getFullYear());

  // Renters & summary
  const [renters, setRenters] = useState<Renter[]>([]);
  const [summary, setSummary] = useState<GroupSummary | null>(null);
  const [monthlyRecords, setMonthlyRecords] = useState<MonthlyRecord[]>([]);
  const [rentersLoading, setRentersLoading] = useState(false);

  // Modals
  const [groupModalOpen, setGroupModalOpen] = useState(false);
  const [editingGroup, setEditingGroup] = useState<RentalGroup | null>(null);
  const [renterModalOpen, setRenterModalOpen] = useState(false);
  const [editingRenter, setEditingRenter] = useState<Renter | null>(null);

  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleLogout = () => { clearStoredAuth(); setIsAuthenticated(false); };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  // ── Load groups ───────────────────────────────
  const loadGroups = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const data = await groupsApi.getGroups();
      setGroups(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load groups');
    }
  }, [isAuthenticated]);

  useEffect(() => { loadGroups(); }, [loadGroups]);

  // ── Load renters + summary for selected group & month ──
  const loadGroupData = useCallback(async () => {
    if (!selectedGroupId || !isAuthenticated) {
      setRenters([]);
      setSummary(null);
      setMonthlyRecords([]);
      return;
    }
    setRentersLoading(true);
    try {
      const [rentersData, summaryData, records] = await Promise.all([
        groupsApi.getRenters(selectedGroupId, month, year),
        groupsApi.getGroupSummary(selectedGroupId, month, year),
        groupsApi.getPaymentRecords(selectedGroupId),
      ]);
      setRenters(rentersData);
      setSummary(summaryData);
      setMonthlyRecords(records);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load data');
    } finally {
      setRentersLoading(false);
    }
  }, [selectedGroupId, month, year, isAuthenticated]);

  useEffect(() => { loadGroupData(); }, [loadGroupData]);

  // ── Not authenticated ─────────────────────────
  if (!isAuthenticated) {
    return <LoginPage onLogin={() => setIsAuthenticated(true)} />;
  }

  const selectedGroup = groups.find(g => g.id === selectedGroupId) || null;

  // ── Group handlers ────────────────────────────
  const handleAddGroup = () => { setEditingGroup(null); setGroupModalOpen(true); };
  const handleEditGroup = (g: RentalGroup) => { setEditingGroup(g); setGroupModalOpen(true); };
  const handleGroupSubmit = async (name: string, id?: string) => {
    if (id) {
      await groupsApi.updateGroup(id, { name });
    } else {
      await groupsApi.createGroup({ name });
    }
    setGroupModalOpen(false);
    setEditingGroup(null);
    await loadGroups();
  };
  const handleDeleteGroup = async (id: string) => {
    await groupsApi.deleteGroup(id);
    if (selectedGroupId === id) { setSelectedGroupId(null); setRenters([]); setSummary(null); setMonthlyRecords([]); }
    await loadGroups();
  };

  // ── Renter handlers ───────────────────────────
  const handleAddRenter = () => { setEditingRenter(null); setRenterModalOpen(true); };
  const handleEditRenter = (r: Renter) => { setEditingRenter(r); setRenterModalOpen(true); };
  const handleRenterSubmit = async (data: CreateRenter & { id?: string }) => {
    if (!selectedGroupId) return;
    if (data.id) {
      await groupsApi.updateRenter(selectedGroupId, data.id, {
        name: data.name, phoneNumber: data.phoneNumber, rentPrice: data.rentPrice,
      });
    } else {
      await groupsApi.addRenter(selectedGroupId, {
        name: data.name, phoneNumber: data.phoneNumber, rentPrice: data.rentPrice,
      });
    }
    setRenterModalOpen(false);
    setEditingRenter(null);
    await loadGroupData();
    await loadGroups();
  };
  const handleDeleteRenter = async (renterId: string) => {
    if (!selectedGroupId || !confirm('Delete this renter?')) return;
    await groupsApi.deleteRenter(selectedGroupId, renterId);
    await loadGroupData();
    await loadGroups();
  };

  // ── Payment toggle ────────────────────────────
  const handleTogglePaid = async (renter: Renter) => {
    if (!selectedGroupId) return;
    const isPaid = renter.payment?.isPaid ?? false;
    await groupsApi.setPayment(selectedGroupId, renter.id, { month, year, isPaid: !isPaid });
    await loadGroupData();
  };

  return (
    <div className="app-shell">
      <header className="header">
        <div className="header-top">
          <div>
            <h1 className="logo">House Rental Manager</h1>
            <p className="tagline">Manage blocks, renters, and monthly payments</p>
          </div>
          <div className="header-actions">
            <span className="header-user">{getStoredUserName() ?? 'User'}</span>
            <button type="button" className="btn btn-ghost btn-sm" onClick={() => { clearStoredAuth(); setIsAuthenticated(false); }}>Log out</button>
          </div>
        </div>
      </header>

      {error && (
        <div className="error-banner" role="alert" style={{ margin: '0 0 1rem 0' }}>
          {error}
          <button type="button" style={{ marginLeft: '1rem', background: 'none', border: 'none', cursor: 'pointer', textDecoration: 'underline', color: 'inherit' }} onClick={() => setError(null)}>Dismiss</button>
        </div>
      )}

      <div className="app-layout">
        <Sidebar
          groups={groups}
          selectedGroupId={selectedGroupId}
          summary={summary}
          monthlyRecords={monthlyRecords}
          onSelectGroup={setSelectedGroupId}
          onAddGroup={handleAddGroup}
          onEditGroup={handleEditGroup}
          onDeleteGroup={handleDeleteGroup}
        />

        <main className="main-content">
          {selectedGroup ? (
            <RenterPanel
              group={selectedGroup}
              renters={renters}
              loading={rentersLoading}
              month={month}
              year={year}
              onMonthChange={setMonth}
              onYearChange={setYear}
              onAddRenter={handleAddRenter}
              onEditRenter={handleEditRenter}
              onDeleteRenter={handleDeleteRenter}
              onTogglePaid={handleTogglePaid}
            />
          ) : (
            <div className="empty-state">
              <h2 style={{ marginBottom: '0.5rem', color: 'var(--text)' }}>Welcome</h2>
              <p>Select a block from the sidebar or create a new one to get started.</p>
            </div>
          )}
        </main>
      </div>

      {groupModalOpen && (
        <GroupFormModal group={editingGroup} onClose={() => { setGroupModalOpen(false); setEditingGroup(null); }} onSubmit={handleGroupSubmit} />
      )}

      {renterModalOpen && (
        <RenterFormModal renter={editingRenter} onClose={() => { setRenterModalOpen(false); setEditingRenter(null); }} onSubmit={handleRenterSubmit} />
      )}
    </div>
  );
}
