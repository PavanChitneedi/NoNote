import { useEffect } from "react";
import { designTokens } from "./designTokens.js";

export default function DesignSystemProvider({ children }) {
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(designTokens.space).forEach(([k, v]) => root.style.setProperty(`--space-${k}`, v));
    Object.entries(designTokens.radius).forEach(([k, v]) => root.style.setProperty(`--radius-ui-${k}`, v));
    Object.entries(designTokens.type).forEach(([k, v]) => root.style.setProperty(`--type-${k}`, String(v)));
    Object.entries(designTokens.shadow).forEach(([k, v]) => root.style.setProperty(`--elevation-${k}`, v));
    root.style.setProperty("--motion-duration-ui", designTokens.motion.durationUi);
    root.style.setProperty("--motion-ease-ui", designTokens.motion.easingUi);
    root.style.setProperty("--motion-transition-interactive", `all ${designTokens.motion.durationUi} ${designTokens.motion.easingUi}`);
    root.style.setProperty("--motion-transition-layout", `all ${designTokens.motion.durationUi} ${designTokens.motion.easingUi}`);
  }, []);

  return children;
}
