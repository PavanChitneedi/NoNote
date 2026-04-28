export const designTokens = {
  color: {
    primary: "var(--accent2)",
    secondaryBg: "var(--bg3)",
    destructive: "var(--danger)",
    text: "var(--text)",
    textMuted: "var(--text3)",
    border: "var(--border)",
    focusRing: "var(--state-focus-ring)",
  },
  type: {
    xs: "10px",
    sm: "12px",
    md: "13px",
    lg: "15px",
    weightRegular: 500,
    weightBold: 700,
  },
  space: {
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
  },
  radius: {
    xs: "6px",
    sm: "8px",
    md: "10px",
    lg: "12px",
    pill: "999px",
  },
  shadow: {
    sm: "var(--shadow-node-xs,2px 2px 5px var(--neu-shadow),-1px -1px 3px var(--neu-hilight))",
    md: "var(--shadow-node-sm,4px 4px 10px var(--neu-shadow),-2px -2px 5px var(--neu-hilight))",
    lg: "var(--nEl,9px 9px 22px var(--neu-shadow),-7px -7px 16px var(--neu-hilight))",
  },
  motion: {
    fast: "120ms",
    normal: "160ms",
    easing: "ease",
  },
};

export const buttonVariants = {
  primary: {
    background: "var(--accent2)",
    color: "var(--on-accent)",
    border: "1px solid var(--accent2)",
  },
  secondary: {
    background: "var(--bg3)",
    color: "var(--text3)",
    border: "1px solid var(--border)",
  },
  destructive: {
    background: "var(--state-soft-danger-bg)",
    color: "var(--danger)",
    border: "1px solid var(--danger)",
  },
  ghost: {
    background: "transparent",
    color: "var(--text3)",
    border: "1px solid transparent",
  },
  toggle: {
    background: "var(--bg3)",
    color: "var(--text3)",
    border: "1px solid var(--border)",
  },
};
