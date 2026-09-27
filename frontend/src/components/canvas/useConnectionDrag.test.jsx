import { useRef } from 'react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import useConnectionDrag from './useConnectionDrag.js';
import ConnectionHandle from './ConnectionHandle.jsx';

function Harness({onConnect,enabled=true}) {
  const rootRef=useRef(null);
  const {begin,preview}=useConnectionDrag({rootRef,enabled,onConnect,scope:'map'});
  return <div ref={rootRef}>
    <div data-connection-node="source" data-testid="source"><ConnectionHandle nodeId="source" title="Source" onStart={begin}/></div>
    <div data-connection-node="target" data-testid="target">Target</div>
    <output>{preview?.targetId || (preview?'dragging':'idle')}</output>
  </div>;
}
function pointer(target,type,properties={}) {
  const event=new Event(type,{bubbles:true,cancelable:true});
  Object.assign(event,{pointerId:1,button:0,clientX:10,clientY:20,...properties});
  fireEvent(target,event);
}
function setup(enabled=true) {
  const onConnect=vi.fn();
  const view=render(<Harness onConnect={onConnect} enabled={enabled}/>);
  const target=screen.getByTestId('target');
  vi.spyOn(target,'getBoundingClientRect').mockReturnValue({left:100,top:0,right:200,bottom:100,width:100,height:100});
  Object.defineProperty(document,'elementFromPoint',{configurable:true,value:vi.fn(()=>target)});
  const handle=screen.getByRole('button',{name:'Connect from Source (right)'});
  pointer(handle,'pointerdown');
  return {onConnect,view,target,handle};
}
afterEach(()=>{vi.restoreAllMocks();delete document.elementFromPoint;});

describe('connection drag',()=>{
  it.each(['mouse','touch'])('connects exactly once on %s release with a rendered target anchor',pointerType=>{
    const {onConnect}=setup();
    pointer(document,'pointermove',{pointerType,clientX:102,clientY:40});
    expect(screen.getByText('target')).toBeInTheDocument();
    pointer(document,'pointerup',{pointerType,clientX:102,clientY:40});
    expect(onConnect).toHaveBeenCalledExactlyOnceWith('source','target',{side:'auto'},{side:'auto'});
    pointer(document,'pointerup',{clientX:102,clientY:40});
    expect(onConnect).toHaveBeenCalledTimes(1);
    expect(screen.getByText('idle')).toBeInTheDocument();
  });
  it.each(['pointercancel','escape','blank','self'])('cancels %s without writing an edge',reason=>{
    const {onConnect}=setup();
    pointer(document,'pointermove',{clientX:102,clientY:40});
    if(reason==='escape') fireEvent.keyDown(document,{key:'Escape'});
    else if(reason==='pointercancel') pointer(document,'pointercancel');
    else {
      document.elementFromPoint.mockReturnValue(reason==='self'?screen.getByTestId('source'):null);
      pointer(document,'pointerup',{clientX:102,clientY:40});
    }
    expect(onConnect).not.toHaveBeenCalled();
    expect(screen.getByText('idle')).toBeInTheDocument();
  });
  it('ignores other pointers and refuses a click without a drag',()=>{
    const {onConnect}=setup();
    pointer(document,'pointermove',{pointerId:2,clientX:102});
    pointer(document,'pointerup',{clientX:102});
    expect(onConnect).not.toHaveBeenCalled();
  });
  it('does not begin in read-only mode',()=>{
    const {onConnect}=setup(false);
    pointer(document,'pointermove',{clientX:102});pointer(document,'pointerup',{clientX:102});
    expect(onConnect).not.toHaveBeenCalled();expect(screen.getByText('idle')).toBeInTheDocument();
  });
  it('cleans up on unmount and cancels when edit permission is revoked',()=>{
    const {onConnect,view}=setup();
    view.rerender(<Harness onConnect={onConnect} enabled={false}/>);
    pointer(document,'pointermove',{clientX:102});pointer(document,'pointerup',{clientX:102});
    expect(onConnect).not.toHaveBeenCalled();
    view.unmount();
    pointer(document,'pointerup',{clientX:102});expect(onConnect).not.toHaveBeenCalled();
  });
});
