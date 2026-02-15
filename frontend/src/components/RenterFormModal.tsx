import { useState, useEffect } from 'react';
import type { Renter, CreateRenter } from '../types/group';

interface RenterFormModalProps {
  renter: Renter | null;
  onClose: () => void;
  onSubmit: (data: CreateRenter & { id?: string }) => Promise<void>;
}

export function RenterFormModal({ renter, onClose, onSubmit }: RenterFormModalProps) {
  const isEdit = renter != null;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rentPrice, setRentPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (renter) {
      setName(renter.name);
      setPhone(renter.phoneNumber);
      setRentPrice(String(renter.rentPrice));
    } else {
      setName('');
      setPhone('');
      setRentPrice('');
    }
  }, [renter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const price = parseFloat(rentPrice);
    if (Number.isNaN(price) || price < 0) {
      setError('Please enter a valid rent price.');
      setSaving(false);
      return;
    }
    try {
      await onSubmit({
        ...(renter?.id && { id: renter.id }),
        name: name.trim(),
        phoneNumber: phone.trim(),
        rentPrice: price,
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{isEdit ? 'Edit Renter' : 'Add Renter'}</h2>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          {error && <div className="error-banner" style={{ marginBottom: '1rem' }} role="alert">{error}</div>}
          <div className="field">
            <label htmlFor="renter-name">Name</label>
            <input id="renter-name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="John Doe" />
          </div>
          <div className="field">
            <label htmlFor="renter-phone">Phone Number</label>
            <input id="renter-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 123-4567" />
          </div>
          <div className="field">
            <label htmlFor="renter-price">Rent Price ($)</label>
            <input id="renter-price" type="number" min={0} step={50} value={rentPrice} onChange={e => setRentPrice(e.target.value)} required placeholder="1200" />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? 'Saving...' : 'Save'}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
