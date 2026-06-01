import React from "react";

export function MetricGrid({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display: "grid",
      gap: "16px",
      gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
      marginBottom: "32px"
    }}>
      {children}
    </div>
  );
}

export function MetricCard({ 
  title, 
  value, 
  trend, 
  trendDirection = "up",
  status = "neutral"
}: { 
  title: string; 
  value: string | number; 
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  status?: "success" | "warning" | "danger" | "neutral";
}) {
  const statusColors = {
    success: "var(--teal)",
    warning: "var(--gold)",
    danger: "var(--rose)",
    neutral: "var(--ink-soft)"
  };

  return (
    <div style={{
      background: "#fff",
      border: "1px solid var(--line-strong)",
      borderRadius: "var(--radius-lg)",
      padding: "24px",
      boxShadow: "var(--shadow-sm)",
      display: "flex",
      flexDirection: "column",
      gap: "8px",
      transition: "transform 0.2s ease, box-shadow 0.2s ease",
      cursor: "default",
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = "translateY(-2px)";
      e.currentTarget.style.boxShadow = "var(--shadow-soft)";
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = "translateY(0)";
      e.currentTarget.style.boxShadow = "var(--shadow-sm)";
    }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
        <h3 style={{ 
          margin: 0, 
          fontSize: "0.85rem", 
          fontWeight: 600, 
          color: "var(--ink-soft)",
          textTransform: "uppercase",
          letterSpacing: "0.05em"
        }}>
          {title}
        </h3>
        <div style={{ 
          width: "8px", 
          height: "8px", 
          borderRadius: "50%", 
          background: statusColors[status],
          boxShadow: `0 0 0 4px ${statusColors[status]}20`
        }} />
      </div>
      
      <div style={{ 
        fontSize: "2.25rem", 
        fontWeight: 800, 
        color: "var(--ink-strong)", 
        lineHeight: 1,
        marginTop: "8px" 
      }}>
        {value}
      </div>

      {trend && (
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: "6px", 
          marginTop: "8px",
          fontSize: "0.85rem",
          fontWeight: 500,
          color: trendDirection === "up" ? "var(--green)" : trendDirection === "down" ? "var(--rose)" : "var(--ink-soft)"
        }}>
          <span>{trendDirection === "up" ? "↑" : trendDirection === "down" ? "↓" : "−"}</span>
          <span>{trend}</span>
        </div>
      )}
    </div>
  );
}
