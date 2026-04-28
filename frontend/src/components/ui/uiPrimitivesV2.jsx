import "./uiPrimitivesV2.css";

/**
 * UI usage contract:
 * - Use these primitives for all app UI controls/surfaces.
 * - Do not add inline style objects in feature components.
 * - Use token-backed class names and shared motion/elevation vars only.
 */

function cx(...parts) {
  return parts.filter(Boolean).join(" ");
}

function sanitizeStyle(style) {
  if (!style) return undefined;
  const clean = { ...style };
  delete clean.transition;
  delete clean.animation;
  delete clean.animationDuration;
  delete clean.animationTimingFunction;
  return clean;
}

export function Button({
  variant = "secondary",
  disabled = false,
  className,
  children,
  style,
  ...props
}) {
  return (
    <button
      {...props}
      disabled={disabled}
      style={sanitizeStyle(style)}
      className={cx(
        "ui-v2-token-contract",
        "ui-v2-button",
        `ui-v2-button--${variant}`,
        className
      )}
    >
      {children}
    </button>
  );
}

export function QuickActionButton({
  variant = "ghost",
  disabled = false,
  className,
  children,
  ...props
}) {
  return (
    <Button
      {...props}
      variant={variant}
      disabled={disabled}
      className={cx("ui-v2-quick-action", className)}
    >
      {children}
    </Button>
  );
}

export function ToggleButton({
  pressed = false,
  disabled = false,
  className,
  children,
  style,
  ...props
}) {
  return (
    <Button
      {...props}
      style={style}
      variant="secondary"
      disabled={disabled}
      aria-pressed={pressed}
      className={cx("ui-v2-toggle-button", className)}
    >
      {children}
    </Button>
  );
}

export function ModeSwitchGroup({
  value,
  options,
  onChange,
  disabled = false,
  className,
}) {
  return (
    <div className={cx("ui-v2-token-contract", "ui-v2-mode-switch-group", className)} role="radiogroup">
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <ToggleButton
            key={opt.value}
            role="radio"
            aria-checked={selected}
            pressed={selected}
            disabled={disabled || opt.disabled}
            onClick={() => !disabled && !opt.disabled && onChange?.(opt.value)}
          >
            {opt.label}
          </ToggleButton>
        );
      })}
    </div>
  );
}

export function NodeCardBase({
  state = "default",
  nodeKind = "DataNode",
  className,
  children,
  ...props
}) {
  return (
    <section
      {...props}
      data-state={state}
      data-node-kind={nodeKind}
      className={cx("ui-v2-token-contract", "ui-v2-node-card", className)}
    >
      {children}
    </section>
  );
}

export function NodeHeader({ className, children, ...props }) {
  return <header {...props} className={cx("ui-v2-node-header", className)}>{children}</header>;
}

export function NodeTitle({ className, children, ...props }) {
  return <h4 {...props} className={cx("ui-v2-node-title", className)}>{children}</h4>;
}

export function NodeSubtitle({ className, children, ...props }) {
  return <p {...props} className={cx("ui-v2-node-subtitle", className)}>{children}</p>;
}

export function NodeToolbar({ className, children, ...props }) {
  return <div {...props} className={cx("ui-v2-node-toolbar", className)}>{children}</div>;
}

export function NodeContent({ className, children, ...props }) {
  return <section {...props} className={cx("ui-v2-node-content", className)}>{children}</section>;
}

export function NodeFooter({ className, children, ...props }) {
  return <footer {...props} className={cx("ui-v2-node-footer", className)}>{children}</footer>;
}

export function NodeInput({ className, ...props }) {
  return <input {...props} className={cx("ui-v2-node-input", className)} />;
}

export function NodeTextarea({ className, ...props }) {
  return <textarea {...props} className={cx("ui-v2-node-textarea", className)} />;
}

export function NodeTooltip({ className, children, ...props }) {
  return <div {...props} className={cx("ui-v2-node-tooltip", className)}>{children}</div>;
}

export function NodeInlineToolbar({ className, children, ...props }) {
  return <div {...props} className={cx("ui-v2-node-inline-toolbar", className)}>{children}</div>;
}

export function NodeSection({ className, children, expanded = false, ...props }) {
  return <section {...props} data-expanded={expanded ? "true" : "false"} className={cx("ui-v2-node-section", className)}>{children}</section>;
}

export function NodeChip({ className, children, ...props }) {
  return <span {...props} className={cx("ui-v2-node-chip", className)}>{children}</span>;
}
