import { useState, useEffect } from 'react';
import type { Renter, CreateRenter } from '../types/group';
import { useLanguage } from '../i18n/LanguageContext';

interface RenterFormModalProps {
  renter: Renter | null;
  onClose: () => void;
  onSubmit: (data: CreateRenter & { id?: string }) => Promise<void>;
}

export function RenterFormModal({ renter, onClose, onSubmit }: RenterFormModalProps) {
  const { t } = useLanguage();
  const isEdit = renter != null;
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [rentPrice, setRentPrice] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (renter) { setName(renter.name); setPhone(renter.phoneNumber); setRentPrice(String(renter.rentPrice)); }
    else { setName(''); setPhone(''); setRentPrice(''); }
  }, [renter]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const price = parseFloat(rentPrice);
    if (Number.isNaN(price) || price < 0) { setError(t.invalidRentPrice); setSaving(false); return; }
    try {
      await onSubmit({ ...(renter?.id && { id: renter.id }), name: name.trim(), phoneNumber: phone.trim(), rentPrice: price });
    } catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{isEdit ? t.editRenter : t.addRenterModal}</h2>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          {error && <div className="error-banner" style={{ marginBottom: '1rem' }} role="alert">{error}</div>}
          <div className="field">
            <label htmlFor="renter-name">{t.name}</label>
            <input id="renter-name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder="John Doe" />
          </div>
          <div className="field">
            <label htmlFor="renter-phone">{t.phoneNumber}</label>
            <input id="renter-phone" type="tel" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+1 (555) 123-4567" />
          </div>
          <div className="field">
            <label htmlFor="renter-price">{t.rentPriceDollar}</label>
            <input id="renter-price" type="number" min={0} step={50} value={rentPrice} onChange={e => setRentPrice(e.target.value)} required placeholder="1200" />
          </div>
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onClose} disabled={saving}>{t.cancel}</button>
            <button type="submit" className="btn btn-primary" disabled={saving}>{saving ? t.saving : t.save}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
