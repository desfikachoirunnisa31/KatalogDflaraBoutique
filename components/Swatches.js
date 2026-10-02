export default function Swatches({ colors, named }) {
  if (!Array.isArray(colors) || colors.length === 0) return null;
  return (
    <ul className={`sw ${named ? 'named' : ''}`} aria-label="Pilihan warna">
      {colors.map((c) => (
        <li key={c.name + c.hex} title={c.name}>
          <i style={{ background: c.hex }} />
          {named && <span>{c.name}</span>}
        </li>
      ))}
    </ul>
  );
}

