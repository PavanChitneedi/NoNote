import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, within } from '@testing-library/react';
import NodeLibrary from './NodeLibrary.jsx';
import { LIBRARY_PREFERENCES_KEY } from '../../lib/nodePackages.js';

beforeEach(() => localStorage.clear());
describe('NodeLibrary', () => {
  it('persists collapsed packages but search reveals their types', () => {
    const view = render(<NodeLibrary addNode={vi.fn()}/>);
    fireEvent.click(screen.getByRole('button',{name:'Servers package'}));
    expect(screen.queryByRole('button',{name:'Add Proxmox VE'})).not.toBeInTheDocument();
    view.unmount();
    render(<NodeLibrary addNode={vi.fn()}/>);
    expect(screen.getByRole('button',{name:'Servers package'})).toHaveAttribute('aria-expanded','false');
    fireEvent.change(screen.getByRole('textbox'),{target:{value:'proxmox'}});
    expect(screen.getByRole('button',{name:'Add Proxmox VE'})).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button',{name:'Clear node search'}));
    expect(screen.queryByRole('button',{name:'Add Proxmox VE'})).not.toBeInTheDocument();
  });
  it('favorites and pins never add a canvas node; selection keeps the legacy ID', () => {
    const add = vi.fn();
    const view = render(<NodeLibrary addNode={add}/>);
    fireEvent.click(screen.getByRole('button',{name:'Favorite Proxmox VE'}));
    fireEvent.click(screen.getByRole('button',{name:'Pin Servers package'}));
    expect(add).not.toHaveBeenCalled();
    view.unmount();
    render(<NodeLibrary addNode={add}/>);
    const favorites = screen.getByRole('region',{name:'Favorite node types'});
    fireEvent.click(within(favorites).getByRole('button',{name:'Add Proxmox VE'}));
    expect(add).toHaveBeenCalledWith('proxmox');
    expect(JSON.parse(localStorage.getItem(LIBRARY_PREFERENCES_KEY)).pinned).toEqual(['servers']);
    expect(screen.getByRole('region',{name:'Recent node types'})).toBeInTheDocument();
  });
  it('renders safely with malformed stored preferences and disables creation for viewers', () => {
    localStorage.setItem(LIBRARY_PREFERENCES_KEY,'{"favorites":42,"recent":null}');
    const add = vi.fn();
    render(<NodeLibrary addNode={add} canEdit={false}/>);
    const button = screen.getByRole('button',{name:'Add Note'});
    expect(button).toBeDisabled();
    fireEvent.click(button);
    expect(add).not.toHaveBeenCalled();
  });
});
