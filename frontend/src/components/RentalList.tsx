import type { Rental } from '../types/rental';

interface RentalListProps {
  rentals: Rental[];
  onEdit: (rental: Rental) => void;
  onDelete: (id: string) => void;
}

function badgeClass(status: string): string {
  switch (status) {
    case 'available':
      return 'badge badge-available';
    case 'occupied':
      return 'badge badge-occupied';
    case 'maintenance':
      return 'badge badge-maintenance';
    default:
      return 'badge badge-occupied';
  }
}

export function RentalList({ rentals, onEdit, onDelete }: RentalListProps) {
  if (rentals.length === 0) return null;

  return (
    <section className="listings" role="list">
      {rentals.map((rental) => (
        <article key={rental.id} className="card" role="listitem">
          <div className="card-header">
            <h3 className="card-address">{rental.address}</h3>
            <span className={badgeClass(rental.status)}>{rental.status}</span>
          </div>
          <div className="card-details">
            <span>{rental.bedrooms} bed</span>
            <span>{rental.bathrooms} bath</span>
            <span className="card-rent">
              ${Number(rental.rent).toLocaleString()}/mo
            </span>
          </div>
          {rental.notes && (
            <p
              className="card-notes"
              style={{
                fontSize: '0.9rem',
                color: 'var(--text-muted)',
                margin: '0 0 0.75rem 0',
              }}
            >
              {rental.notes}
            </p>
          )}
          <div className="card-actions">
            <button
              type="button"
              className="btn btn-primary btn-sm"
              onClick={() => onEdit(rental)}
            >
              Update
            </button>
            <button
              type="button"
              className="btn btn-danger btn-sm"
              onClick={() => onDelete(rental.id)}
            >
              Delete
            </button>
          </div>
        </article>
      ))}
    </section>
  );
}
