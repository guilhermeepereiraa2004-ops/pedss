export default function Metrics({ items }) {
  return (
    <div className="metrics-grid">
      {items.map(({ label, value, detail, icon: Icon }, i) => (
        <article className={`metric-card ${i === 0 ? "highlight" : ""}`} key={label}>
          <div className="metric-top">
            <span>{label}</span>
            <Icon size={17} />
          </div>
          <strong>{value}</strong>
          <small>{detail}</small>
        </article>
      ))}
    </div>
  );
}
