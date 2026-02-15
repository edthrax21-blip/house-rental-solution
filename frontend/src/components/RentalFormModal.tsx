import { useState, useEffect } from 'react';
import type { Rental } from '../types/rental';
import type { RentalCreate } from '../types/rental';

interface RentalFormModalProps {
  rental: Rental | null;
  onClose: () => void;
  onSubmit: (data: RentalCreate & { id?: string }) => Promise<void>;
}

export function RentalFormModal({
  rental,
  onClose,
  onSubmit,
}: RentalFormModalProps) {
  const isEdit = rental != null;
  const [address, setAddress] = useState('');
  const [bedrooms, setBedrooms] = useState(2);
  const [bathrooms, setBathrooms] = useState(1);
  const [rent, setRent] = useState('');
  const [status, setStatus] = useState('available');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (rental) {
      setAddress(rental.address);
      setBedrooms(rental.bedrooms);
      setBathrooms(rental.bathrooms);
      setRent(String(rental.rent));
      setStatus(rental.status);
      setNotes(rental.notes ?? '');
    } else {
      setAddress('');
      setBedrooms(2);
      setBathrooms(1);
      setRent('');
      setStatus('available');
      setNotes('');
    }
  }, [rental]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const rentNum = parseFloat(rent);
    if (Number.isNaN(rentNum) || rentNum < 0) {
      setError('Please enter a valid rent amount.');
      setSaving(false);
      return;
    }
    try {
      await onSubmit({
        ...(rental?.id && { id: rental.id }),
        address: address.trim(),
        bedrooms,
        bathrooms,
        rent: rentNum,
        status,
        notes: notes.trim() || null,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal">
        <div className="modal-header">
          <h2 id="modal-title">{isEdit ? 'Update rental' : 'Add rental'}</h2>
          <button
            type="button"
            className="btn-close"
            onClick={onClose}
            aria-label="Close"
          >
            ×
          </button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          {error && (
            <div
              className="error-banner"
              style={{ marginBottom: '1rem' }}
              role="alert"
            >
              {error}
            </div>
          )}
          <div className="field">
            <label htmlFor="address">Address</label>
            <input
              id="address"
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              required
              placeholder="123 Main St, City"
            />
          </div>
          <div className="field-row">
            <div className="field">
              <label htmlFor="bedrooms">Bedrooms</label>
              <input
                id="bedrooms"
                type="number"
                min={1}
                max={20}
                value={bedrooms}
                onChange={(e) => setBedrooms(parseInt(e.target.value, 10) || 1)}
                required
              />
            </div>
            <div className="field">
              <label htmlFor="bathrooms">Bathrooms</label>
              <input
                id="bathrooms"
                type="number"
                min={1}
                max={20}
                step={0.5}
                value={bathrooms}
                onChange={(e) =>
                  setBathrooms(parseFloat(e.target.value) || 1)
                }
                required
              />
            </div>
          </div>
          <div className="field">
            <label htmlFor="rent">Monthly rent ($)</label>
            <input
              id="rent"
              type="number"
              min={0}
              step={50}
              value={rent}
              onChange={(e) => setRent(e.target.value)}
              required
              placeholder="1200"
            />
          </div>
          <div className="field">
            <label htmlFor="status">Status</label>
            <select
              id="status"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="available">Available</option>
              <option value="occupied">Occupied</option>
              <option value="maintenance">Maintenance</option>
            </select>
          </div>
          <div className="field">
            <label htmlFor="notes">Notes</label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Optional notes…"
            />
          </div>
          <div className="modal-actions">
            <button
              type="button"
              className="btn btn-ghost"
              onClick={onClose}
              disabled={saving}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={saving}
            >
              {saving ? 'Saving…' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
