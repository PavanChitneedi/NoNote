import { useEffect } from "react";
import { designTokens } from "./designTokens.js";

export default function DesignSystemProvider({ children }) {
  useEffect(() => {
    const root = document.documentElement;
    Object.entries(designTokens.space).forEach(([k, v]) => root.style.setProperty(`--space-${k}`, v));
    Object.entries(designTokens.radius).forEach(([k, v]) => root.style.setProperty(`--radius-ui-${k}`, v));
    Object.entries(designTokens.type).forEach(([k, v]) => root.style.setProperty(`--type-${k}`, String(v)));
    Object.entries(designTokens.motion).forEach(([k, v]) => root.style.setProperty(`--motion-${k}`, v));
  }, []);

  return children;
}
