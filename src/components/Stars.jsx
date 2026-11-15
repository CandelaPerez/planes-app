import { ratingDescriptions } from '../utils/planUtils';

function Stars({ value = 0, interactive = false, onChange, disabled = false }) {
  return <span className={`rating-stars ${interactive ? 'interactive' : ''}`} role={interactive ? 'group' : 'img'} aria-label={value ? `${value} de 5 estrellas` : 'Sin valoraciones'}>
    {[1, 2, 3, 4, 5].map((star) => interactive
      ? <button key={star} type="button" aria-label={`${star} ${star === 1 ? 'estrella' : 'estrellas'}: ${ratingDescriptions[star - 1]}`} title={ratingDescriptions[star - 1]} disabled={disabled} onClick={() => onChange(star)} className={star <= value ? 'star selected' : 'star'}>★</button>
      : <span key={star} className={star <= Math.round(value) ? 'star selected' : 'star'}>★</span>)}
  </span>;
}

export default Stars;
