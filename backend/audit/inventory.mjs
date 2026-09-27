import { readdir, readFile, writeFile } from 'node:fs/promises';
import { resolve, relative, dirname } from 'node:path';
const root=resolve(import.meta.dirname,'../..');
async function walk(dir){const out=[];for(const d of await readdir(dir,{withFileTypes:true})){if(['node_modules','dist','.git','audit','audit-2026-09-27'].includes(d.name))continue;const p=resolve(dir,d.name);if(d.isDirectory())out.push(...await walk(p));else if(/\.(jsx?|html|sql|sh|yml|json|md)$/.test(p)&&!p.endsWith('package-lock.json'))out.push(p);}return out;}
const files=[...await walk(resolve(root,'frontend/src')),...await walk(resolve(root,'backend/src'))], texts=new Map(await Promise.all(files.map(async p=>[p,await readFile(p,'utf8')])));
const source=files.filter(p=>/[/\\]src[/\\]/.test(p)&&/\.jsx?$/.test(p)&&!p.includes('.test.')&&!p.endsWith('test-setup.js'));
const graph=new Map(source.map(p=>[p,[...texts.get(p).matchAll(/(?:from\s*|import\s*\(?\s*)["'](\.[^"']+)["']/g)].map(m=>resolve(dirname(p),m[1]))]));
const reached=new Set();function visit(p){if(reached.has(p))return;reached.add(p);for(const child of graph.get(p)||[])visit(child);}visit(resolve(root,'frontend/src/main.jsx'));visit(resolve(root,'backend/src/index.js'));
const report={sourceFiles:source.length,sourceLines:source.reduce((n,p)=>n+texts.get(p).split('\n').length,0),files:source.map(p=>({path:relative(root,p).replaceAll('\\','/'),lines:texts.get(p).split('\n').length,reachable:reached.has(p)})),unreachableCandidates:source.filter(p=>!reached.has(p)).map(p=>relative(root,p)),invalidAlphaExpressions:source.reduce((n,p)=>n+[...texts.get(p).matchAll(/var\(--[\w-]+\)[0-9a-fA-F]{2}\b/g)].length,0)};
await writeFile(resolve(root,'docs/audit-2026-09-27/inventory.json'),JSON.stringify(report,null,2));
console.log(JSON.stringify({...report,files:undefined},null,2));
