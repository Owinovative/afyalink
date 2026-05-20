import Link from "next/link";

export function EmptyState({
  title,
  body,
  href,
  action,
}: {
  title: string;
  body: string;
  href?: string;
  action?: string;
}) {
  return (
    <div className="empty-state">
      <h3>{title}</h3>
      <p>{body}</p>
      {href && action ? (
        <div className="action-row" style={{ marginTop: 16 }}>
          <Link className="button secondary" href={href}>
            {action}
          </Link>
        </div>
      ) : null}
    </div>
  );
}
