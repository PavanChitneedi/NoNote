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
    0: "0px",
    1: "4px",
    2: "8px",
    3: "12px",
    4: "16px",
    5: "20px",
    6: "24px",
    7: "28px",
    8: "32px",
  },
  radius: {
    xs: "6px",
    sm: "8px",
    md: "10px",
    lg: "12px",
    pill: "999px",
  },
  shadow: {
    level0: "none",
    level1: "var(--nEx,2px 2px 5px var(--neu-shadow),-2px -2px 3px var(--neu-hilight))",
    level2: "var(--nEs,4px 4px 9px var(--neu-shadow),-3px -3px 6px var(--neu-hilight))",
    level3: "var(--nEl,9px 9px 22px var(--neu-shadow),-7px -7px 16px var(--neu-hilight))",
    insetActive: "var(--neu-inset-xs)",
    focus: "var(--shadow-focus)",
  },
  motion: {
    durationUi: "160ms",
    easingUi: "cubic-bezier(0.2, 0, 0, 1)",
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
