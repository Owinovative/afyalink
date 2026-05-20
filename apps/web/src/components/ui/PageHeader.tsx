export function PageHeader({
  eyebrow,
  title,
  body,
  actions,
}: {
  eyebrow?: string;
  title: string;
  body?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="page-header">
      <div>
        {eyebrow ? <div className="eyebrow">{eyebrow}</div> : null}
        <h1 style={{ fontSize: "clamp(2rem, 4vw, 3.6rem)", lineHeight: 1.02 }}>{title}</h1>
        {body ? <p>{body}</p> : null}
      </div>
      {actions ? <div className="action-row">{actions}</div> : null}
    </header>
  );
}
