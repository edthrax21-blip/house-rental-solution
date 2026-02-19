import { useState, useEffect } from 'react';
import type { RentalGroup } from '../types/group';
import { useLanguage } from '../i18n/LanguageContext';

interface GroupFormModalProps {
  group: RentalGroup | null;
  onClose: () => void;
  onSubmit: (name: string, id?: string) => Promise<void>;
}

export function GroupFormModal({ group, onClose, onSubmit }: GroupFormModalProps) {
  const { t } = useLanguage();
  const isEdit = group != null;
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { setName(group?.name ?? ''); }, [group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name.trim()) { setError(t.nameRequired); return; }
    setSaving(true);
    try { await onSubmit(name.trim(), group?.id); }
    catch (e) { setError(e instanceof Error ? e.message : 'Save failed'); }
    finally { setSaving(false); }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-modal="true" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal">
        <div className="modal-header">
          <h2>{isEdit ? t.editBlock : t.addBlockModal}</h2>
          <button type="button" className="btn-close" onClick={onClose} aria-label="Close">&times;</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          {error && <div className="error-banner" style={{ marginBottom: '1rem' }} role="alert">{error}</div>}
          <div className="field">
            <label htmlFor="group-name">{t.blockName}</label>
            <input id="group-name" type="text" value={name} onChange={e => setName(e.target.value)} required placeholder={t.blockPlaceholder} autoFocus />
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
