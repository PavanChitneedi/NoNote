import './ConnectionHandle.css';

const SIDES = {
  top: {left:'50%',top:0}, right: {left:'100%',top:'50%'},
  bottom: {left:'50%',top:'100%'}, left: {left:0,top:'50%'},
};

export default function ConnectionHandle({ nodeId, title, onStart, zoom = 1, active = false, mobile = false }) {
  return <div className={`connection-points${active?' connection-points-active':''}${mobile?' connection-points-mobile':''}`}>
    {Object.entries(SIDES).map(([side,position])=><button key={side} type="button"
      className="connection-point" aria-label={`Connect from ${title || 'node'} (${side})`}
      title={`Drag from the ${side} edge to another node`}
      onPointerDown={event => onStart(event, nodeId, {side,t:.5})}
      onMouseDown={event => event.stopPropagation()} onTouchStart={event => event.stopPropagation()}
      onClick={event => event.stopPropagation()} onDoubleClick={event => event.stopPropagation()}
      style={{...position,width:(mobile?40:28)/zoom,height:(mobile?40:28)/zoom,'--point-size':`${8/zoom}px`}}>
      <span aria-hidden="true"/>
    </button>)}
  </div>;
}
