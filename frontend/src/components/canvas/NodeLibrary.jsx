import { useState } from 'react';
import { NT } from '../../lib/nodeTypes.js';
import { findNodePackages, LIBRARY_PREFERENCES_KEY, normalizeLibraryPreferences } from '../../lib/nodePackages.js';
import NodeIcon from './NodeIcon.jsx';
import './NodeLibrary.css';

function readPreferences() {
  try { return normalizeLibraryPreferences(JSON.parse(localStorage.getItem(LIBRARY_PREFERENCES_KEY))); }
  catch { return normalizeLibraryPreferences(null); }
}

function TypeList({ ids, preferences, toggleFavorite, choose, canEdit, iconOnly }) {
  return <div className="node-library-types">
    {ids.map(id => {
      const type = NT[id];
      const favorite = preferences.favorites.includes(id);
      return <div className="node-library-type" key={id}>
        <button type="button" className="node-library-add" disabled={!canEdit}
          title={`Add ${type.label}`} aria-label={`Add ${type.label}`} onClick={() => choose(id)}>
          <NodeIcon icon={type.icon} color={type.color} size={17}/>
          {!iconOnly && <span>{type.label}</span>}
        </button>
        {!iconOnly && <button type="button" className="node-library-favorite"
          aria-label={`${favorite ? 'Unfavorite' : 'Favorite'} ${type.label}`}
          title={`${favorite ? 'Unfavorite' : 'Favorite'} ${type.label}`}
          aria-pressed={favorite} onClick={() => toggleFavorite(id)}>{favorite ? '★' : '☆'}</button>}
      </div>;
    })}
  </div>;
}

export default function NodeLibrary({ addNode, canEdit = true, iconOnly = false, dense = false, recentTypes = [], onExpand }) {
  const [search, setSearch] = useState('');
  const [preferences, setPreferences] = useState(readPreferences);
  const update = next => {
    // Save before addNode can close/unmount the mobile picker.
    try { localStorage.setItem(LIBRARY_PREFERENCES_KEY, JSON.stringify(next)); } catch {}
    setPreferences(next);
  };
  const toggle = (key, id) => update({ ...preferences,
    [key]: preferences[key].includes(id) ? preferences[key].filter(item => item !== id) : [...preferences[key], id],
  });
  const choose = id => {
    if (!canEdit) return;
    update({ ...preferences, recent: [id, ...preferences.recent.filter(item => item !== id)].slice(0, 8) });
    addNode(id);
  };
  const packages = findNodePackages(search, preferences.pinned);
  const recent = [...new Set([...preferences.recent, ...(Array.isArray(recentTypes) ? recentTypes : [])])]
    .filter(id => Object.hasOwn(NT, id)).slice(0, 8);
  const listProps = { preferences, choose, canEdit, iconOnly, toggleFavorite: id => toggle('favorites', id) };
  return <div className={`node-library${iconOnly ? ' node-library-icons' : ''}${dense ? ' node-library-dense' : ''}`}>
    {!iconOnly ? <div className="node-library-search">
      <input aria-label="Search all node packages" placeholder="Search types…" value={search}
        onChange={event => setSearch(event.target.value)}/>
      {search && <button type="button" aria-label="Clear node search" onClick={() => setSearch('')}>×</button>}
    </div> : <button type="button" title="Expand to search packages" aria-label="Expand to search packages" onClick={onExpand}>⌕</button>}
    {!iconOnly && <p className="node-library-hint">Pin packages · Star favorites</p>}
    <div className="node-library-scroll">
      {!search.trim() && preferences.favorites.length > 0 && <section aria-label="Favorite node types">
        <h3 title="Favorites">{iconOnly ? '★' : 'FAVORITES'}</h3>
        <TypeList ids={preferences.favorites} {...listProps}/>
      </section>}
      {!search.trim() && recent.length > 0 && <section aria-label="Recent node types">
        <h3 title="Recent">{iconOnly ? '◷' : 'RECENT'}</h3>
        <TypeList ids={recent} {...listProps}/>
      </section>}
      {packages.map(pkg => {
        const open = !!search.trim() || !preferences.collapsed.includes(pkg.id);
        const pinned = preferences.pinned.includes(pkg.id);
        return <section key={pkg.id} aria-label={`${pkg.label} package`}>
          <div className="node-library-heading">
            <button type="button" aria-expanded={open} aria-label={`${pkg.label} package`}
              title={`${pkg.label} package (${pkg.typeIds.length} types)`}
              onClick={() => toggle('collapsed', pkg.id)}>
              <span aria-hidden="true">{open ? '▾' : '▸'}</span>
              {!iconOnly && <><span className="node-library-name">{pkg.label.toUpperCase()}</span><small>{pkg.typeIds.length}</small></>}
            </button>
            {!iconOnly && <button type="button" aria-label={`${pinned ? 'Unpin' : 'Pin'} ${pkg.label} package`}
              title={`${pinned ? 'Unpin' : 'Pin'} ${pkg.label} package`} aria-pressed={pinned}
              onClick={() => toggle('pinned', pkg.id)}>{pinned ? '●' : '○'}</button>}
          </div>
          {open && <TypeList ids={pkg.typeIds} {...listProps}/>}
        </section>;
      })}
      {!packages.length && <p className="node-library-hint">No nodes match “{search}”</p>}
    </div>
    {!canEdit && !iconOnly && <p className="node-library-hint">View only</p>}
  </div>;
}
