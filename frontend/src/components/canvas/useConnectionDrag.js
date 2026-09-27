import { useEffect, useRef, useState } from 'react';
import { routeConnections, roundedPolyPath } from '../../lib/edgeRouting.js';

export function connectionTarget(root, x, y, sourceId) {
  const element = document.elementFromPoint(x, y)?.closest('[data-connection-node]');
  const id = element?.getAttribute('data-connection-node');
  if (!id || id === sourceId || !root?.contains(element)) return null;
  const rect = element.getBoundingClientRect();
  if (!rect.width || !rect.height) return null;
  const distances = [
    ['left', Math.abs(x - rect.left)], ['right', Math.abs(x - rect.right)],
    ['top', Math.abs(y - rect.top)], ['bottom', Math.abs(y - rect.bottom)],
  ].sort((a, b) => a[1] - b[1]);
  const side = distances[0][0];
  const t = side === 'left' || side === 'right' ? (y - rect.top) / rect.height : (x - rect.left) / rect.width;
  return { id, anchor: { side, t: Math.max(0, Math.min(1, t)) } };
}

// Pointer capture keeps touch drags alive; hit-testing finds the actual drop node
// instead of the captured source. Coordinates come from rendered DOM bounds.
export default function useConnectionDrag({ rootRef, enabled, onConnect, scope, edges = [], nodes = [], zoom = 1 }) {
  const [preview, setPreview] = useState(null);
  const cleanup = useRef(null);
  const latest = useRef({ enabled, onConnect });
  latest.current = { enabled, onConnect, edges, nodes, zoom };
  useEffect(() => () => cleanup.current?.(), [scope]);
  useEffect(() => { if (!enabled) cleanup.current?.(); }, [enabled]);

  const begin = (event, sourceId, _fromAnchor = { side: 'right', t: .5 }) => {
    event.stopPropagation();
    if (!enabled || event.button !== 0) return;
    event.preventDefault();
    cleanup.current?.();
    const handle = event.currentTarget;
    const pointerId = event.pointerId;
    const start = { x: event.clientX, y: event.clientY };
    let moved = false;
    const move = e => {
      if (e.pointerId !== pointerId) return;
      e.preventDefault();
      e.stopPropagation();
      moved ||= Math.hypot(e.clientX - start.x, e.clientY - start.y) > 5;
      const target = connectionTarget(rootRef.current, e.clientX, e.clientY, sourceId);
      let path;
      if (target) {
        const scale = latest.current.zoom;
        const boxes = Array.from(rootRef.current.querySelectorAll('[data-connection-node]')).map(el => {
          const r = el.getBoundingClientRect();
          return {type:latest.current.nodes.find(n=>n.id===el.dataset.connectionNode)?.type,id:el.dataset.connectionNode,x:r.left/scale,y:r.top/scale,w:r.width/scale,h:r.height/scale};
        });
        const pending = {id:'__preview__',from:sourceId,to:target.id};
        const pts = routeConnections(boxes,[...latest.current.edges,pending]).__preview__;
        if (pts) path = roundedPolyPath(pts.map(p=>({x:p.x*scale,y:p.y*scale})),0);
      }
      setPreview({ start, x: e.clientX, y: e.clientY, targetId: target?.id, path });
    };
    const clear = () => {
      document.removeEventListener('pointermove', move, true);
      document.removeEventListener('pointerup', finish, true);
      document.removeEventListener('pointercancel', cancel, true);
      document.removeEventListener('keydown', key, true);
      handle.removeEventListener('lostpointercapture', cancel);
      window.removeEventListener('blur', clear);
      cleanup.current = null;
      if (handle.hasPointerCapture?.(pointerId)) handle.releasePointerCapture(pointerId);
      setPreview(null);
    };
    const cancel = e => { if (e.pointerId === pointerId) clear(); };
    const key = e => { if (e.key === 'Escape') { e.stopPropagation(); clear(); } };
    const finish = e => {
      if (e.pointerId !== pointerId) return;
      e.preventDefault();
      e.stopPropagation();
      const target = connectionTarget(rootRef.current, e.clientX, e.clientY, sourceId);
      clear();
      if (moved && target && latest.current.enabled) latest.current.onConnect(sourceId, target.id, {side:'auto'}, {side:'auto'});
    };
    cleanup.current = clear;
    handle.setPointerCapture?.(pointerId);
    document.addEventListener('pointermove', move, { capture: true, passive: false });
    document.addEventListener('pointerup', finish, true);
    document.addEventListener('pointercancel', cancel, true);
    document.addEventListener('keydown', key, true);
    handle.addEventListener('lostpointercapture', cancel);
    window.addEventListener('blur', clear);
    setPreview({ start, x: start.x, y: start.y, targetId: null });
  };
  return { begin, preview };
}
