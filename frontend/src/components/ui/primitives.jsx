import { buttonVariants, designTokens } from "../../ui/designTokens.js";

const baseControl = {
  fontFamily: "var(--font-ui)",
  fontSize: designTokens.type.sm,
  borderRadius: "var(--radius-ui-sm)",
  transition: `all var(--motion-normal) var(--motion-easing)`,
  outline: "none",
};

export function Button({
  variant = "secondary",
  active = false,
  loading = false,
  disabled = false,
  style,
  children,
  ...props
}) {
  const v = buttonVariants[variant] || buttonVariants.secondary;
  const isDisabled = disabled || loading;
  const resolved = variant === "toggle" && active
    ? { background: "var(--state-selected-bg)", color: "var(--accent)", border: "1px solid var(--accent)" }
    : v;

  return (
    <button
      {...props}
      disabled={isDisabled}
      data-role={props["data-role"] || "action-btn"}
      data-state={active ? "active" : undefined}
      style={{
        ...baseControl,
        ...resolved,
        padding: "8px 12px",
        fontWeight: 700,
        cursor: isDisabled ? "not-allowed" : "pointer",
        opacity: isDisabled ? 0.6 : 1,
        ...(style || {}),
      }}
    >
      {loading ? "…" : children}
    </button>
  );
}

export function Input({ style, ...props }) {
  return (
    <input
      {...props}
      data-role={props["data-role"] || "input"}
      style={{
        ...baseControl,
        width: "100%",
        boxSizing: "border-box",
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        color: "var(--text)",
        padding: "8px 10px",
        ...(style || {}),
      }}
    />
  );
}

export function Select({ style, children, ...props }) {
  return (
    <select
      {...props}
      data-role={props["data-role"] || "input"}
      style={{
        ...baseControl,
        width: "100%",
        boxSizing: "border-box",
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        color: "var(--text)",
        padding: "8px 10px",
        ...(style || {}),
      }}
    >
      {children}
    </select>
  );
}

export function Toggle({ checked, onChange, disabled = false }) {
  return (
    <button
      type="button"
      onClick={() => !disabled && onChange?.(!checked)}
      disabled={disabled}
      data-role="toggle"
      data-state={checked ? "active" : "default"}
      style={{
        ...baseControl,
        width: 46,
        height: 26,
        borderRadius: 13,
        border: "1px solid var(--border)",
        background: checked ? "var(--accent2)" : "var(--bg3)",
        position: "relative",
        cursor: disabled ? "not-allowed" : "pointer",
        padding: 0,
      }}
    >
      <span
        style={{
          width: 20,
          height: 20,
          borderRadius: "50%",
          background: "var(--on-accent)",
          position: "absolute",
          top: 2,
          left: checked ? 23 : 2,
          transition: `left var(--motion-fast) var(--motion-easing)`,
        }}
      />
    </button>
  );
}

export function Checkbox({ checked, onChange, disabled = false, label }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text3)", cursor: disabled ? "not-allowed" : "pointer" }}>
      <input type="checkbox" checked={checked} onChange={(e) => onChange?.(e.target.checked)} disabled={disabled} />
      {label}
    </label>
  );
}

export function Radio({ checked, onChange, disabled = false, label, name, value }) {
  return (
    <label style={{ display: "inline-flex", alignItems: "center", gap: 8, color: "var(--text3)", cursor: disabled ? "not-allowed" : "pointer" }}>
      <input type="radio" checked={checked} onChange={() => onChange?.(value)} disabled={disabled} name={name} value={value} />
      {label}
    </label>
  );
}

export function Card({ style, children, ...props }) {
  return (
    <div
      {...props}
      data-role={props["data-role"] || "card"}
      style={{
        background: "var(--bg2)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-ui-md)",
        boxShadow: designTokens.shadow.sm,
        ...(style || {}),
      }}
    >
      {children}
    </div>
  );
}

export function Modal({ style, children, ...props }) {
  return (
    <div
      {...props}
      data-role="modal"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1200,
        background: "var(--overlay-scrim-2)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
        ...(style || {}),
      }}
    >
      {children}
    </div>
  );
}

export function Badge({ tone = "neutral", style, children }) {
  const toneMap = {
    neutral: { background: "var(--bg3)", color: "var(--text3)", border: "1px solid var(--border)" },
    success: { background: "var(--state-soft-success-bg)", color: "var(--success)", border: "1px solid var(--success)" },
    danger: { background: "var(--state-soft-danger-bg)", color: "var(--danger)", border: "1px solid var(--danger)" },
    accent: { background: "var(--state-selected-bg)", color: "var(--accent)", border: "1px solid var(--accent)" },
  };
  const t = toneMap[tone] || toneMap.neutral;
  return <span style={{ fontSize: 10, padding: "2px 8px", borderRadius: "var(--radius-ui-pill)", ...t, ...(style || {}) }}>{children}</span>;
}

export function Alert({ tone = "danger", style, children }) {
  const toneMap = {
    success: { background: "var(--state-soft-success-bg)", color: "var(--success)", border: "1px solid var(--success)" },
    danger: { background: "var(--state-soft-danger-bg)", color: "var(--danger)", border: "1px solid var(--danger)" },
    accent: { background: "var(--state-selected-bg)", color: "var(--accent)", border: "1px solid var(--accent)" },
  };
  const t = toneMap[tone] || toneMap.danger;
  return <div style={{ padding: "10px 12px", borderRadius: "var(--radius-ui-sm)", ...t, ...(style || {}) }}>{children}</div>;
}
