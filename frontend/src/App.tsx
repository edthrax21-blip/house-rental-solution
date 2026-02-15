import { useState, useEffect, useCallback } from 'react';
import { api } from './api/client';
import { getStoredToken, clearStoredAuth, getStoredUserName } from './api/auth';
import type { Rental, RentalCreate } from './types/rental';
import { RentalList } from './components/RentalList';
import { RentalFormModal } from './components/RentalFormModal';
import { LoginPage } from './components/LoginPage';
import './App.css';

export default function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(!!getStoredToken());
  const [rentals, setRentals] = useState<Rental[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingRental, setEditingRental] = useState<Rental | null>(null);

  useEffect(() => {
    const handleLogout = () => {
      clearStoredAuth();
      setIsAuthenticated(false);
    };
    window.addEventListener('auth:logout', handleLogout);
    return () => window.removeEventListener('auth:logout', handleLogout);
  }, []);

  // All hooks MUST be declared before any conditional return (React Rules of Hooks)
  const loadRentals = useCallback(async () => {
    if (!isAuthenticated) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.getRentals({
        status: statusFilter || undefined,
        search: search.trim() || undefined,
      });
      setRentals(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load rentals');
      setRentals([]);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, search, statusFilter]);

  useEffect(() => {
    loadRentals();
  }, [loadRentals]);

  // ── Not authenticated -> show login ─────────────────────────
  if (!isAuthenticated) {
    return (
      <LoginPage
        onLogin={() => {
          setIsAuthenticated(true);
        }}
      />
    );
  }

  const handleAdd = () => {
    setEditingRental(null);
    setModalOpen(true);
  };

  const handleEdit = (rental: Rental) => {
    setEditingRental(rental);
    setModalOpen(true);
  };

  const handleCloseModal = () => {
    setModalOpen(false);
    setEditingRental(null);
  };

  const handleSubmit = async (data: RentalCreate & { id?: string }) => {
    try {
      if (data.id) {
        await api.updateRental(data.id, {
          address: data.address,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          rent: data.rent,
          status: data.status,
          notes: data.notes,
        });
      } else {
        await api.createRental({
          address: data.address,
          bedrooms: data.bedrooms,
          bathrooms: data.bathrooms,
          rent: data.rent,
          status: data.status,
          notes: data.notes,
        });
      }
      handleCloseModal();
      loadRentals();
    } catch (e) {
      throw e;
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this rental listing?')) return;
    try {
      await api.deleteRental(id);
      loadRentals();
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Delete failed');
    }
  };

  return (
    <>
      <header className="header">
        <div className="header-top">
          <div>
            <h1 className="logo">House Rental Manager</h1>
            <p className="tagline">Manage rentals with React frontend and .NET API</p>
          </div>
          <div className="header-actions">
            <span className="header-user">{getStoredUserName() ?? 'User'}</span>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={() => {
                clearStoredAuth();
                setIsAuthenticated(false);
              }}
            >
              Log out
            </button>
            <button type="button" className="btn btn-primary" onClick={handleAdd}>
              + Add rental
            </button>
          </div>
        </div>
      </header>

      <main className="main">
        <section className="filters">
          <input
            type="search"
            className="search"
            placeholder="Search by address or notes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search rentals"
          />
          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="available">Available</option>
            <option value="occupied">Occupied</option>
            <option value="maintenance">Maintenance</option>
          </select>
        </section>

        {error && (
          <div className="error-banner" role="alert">
            {error} — Is the API running at http://localhost:5000?
          </div>
        )}

        {loading ? (
          <p className="empty-state">Loading...</p>
        ) : (
          <RentalList
            rentals={rentals}
            onEdit={handleEdit}
            onDelete={handleDelete}
          />
        )}

        {!loading && rentals.length === 0 && !error && (
          <p className="empty-state">
            No rentals yet. Click "Add rental" to create your first listing.
          </p>
        )}
      </main>

      {modalOpen && (
        <RentalFormModal
          rental={editingRental}
          onClose={handleCloseModal}
          onSubmit={handleSubmit}
        />
      )}
    </>
  );
}
