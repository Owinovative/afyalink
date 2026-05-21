import { Badge } from "@/components/ui/Badge";
import { display } from "@/lib/formatters";

export function MetricGrid({ metrics }: { metrics: Array<{ label: string; value: unknown; body?: string }> }) {
  return (
    <div className={`metric-grid count-${metrics.length}`}>
      {metrics.map((metric) => (
        <div className="metric-card" key={metric.label}>
          <strong>{display(metric.value, "0")}</strong>
          <h3>{metric.label}</h3>
          {metric.body ? <p>{metric.body}</p> : null}
        </div>
      ))}
    </div>
  );
}

export function MetaGrid({ items }: { items: Array<{ label: string; value: unknown }> }) {
  return (
    <div className="meta-grid">
      {items.map((item) => (
        <div className="meta-item" key={item.label}>
          <span>{item.label}</span>
          <strong>{display(item.value)}</strong>
        </div>
      ))}
    </div>
  );
}

export function DataRow({
  title,
  status,
  meta,
  children,
}: {
  title: string;
  status?: unknown;
  meta?: Array<{ label: string; value: unknown }>;
  children?: React.ReactNode;
}) {
  return (
    <article className="data-row">
      <header>
        <h3>{title}</h3>
        {status ? <Badge value={status} /> : null}
      </header>
      {meta ? <MetaGrid items={meta} /> : null}
      {children}
    </article>
  );
}
