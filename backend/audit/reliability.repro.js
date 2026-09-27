// Phase 1 regression assertions converted from audit reproductions.
// All data is synthetic; PostgreSQL and Redis are mocked.
import { beforeEach, expect, it, vi } from 'vitest';
import express from 'express';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import { hashRefreshToken } from '../src/utils/refreshToken.js';
const mocks = vi.hoisted(() => ({ query: vi.fn(), client: { query: vi.fn() } }));
vi.mock('../src/db/pool.js', () => ({ query: mocks.query, withTransaction: async fn => fn(mocks.client) }));
vi.mock('../src/db/redis.js', () => ({ default: { get: vi.fn().mockResolvedValue(null) }, PREFIXES: { userSession: 'us:' } }));
vi.mock('../src/utils/logger.js', () => ({ appLog: vi.fn().mockResolvedValue() }));
import maps from '../src/routes/maps.js';
import users from '../src/routes/users.js';
const app = express(); app.use(express.json()); app.use('/maps', maps); app.use('/users', users);
const user = { id:'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa', role:'admin', is_active:true };
const mapId='bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb';
const nodeId='cccccccc-cccc-4ccc-8ccc-cccccccccccc';
const edgeId='dddddddd-dddd-4ddd-8ddd-dddddddddddd';
process.env.JWT_ACCESS_SECRET='audit-synthetic-secret';
const auth = () => `Bearer ${jwt.sign({sub:user.id}, process.env.JWT_ACCESS_SECRET)}`;
beforeEach(() => { vi.clearAllMocks(); mocks.query.mockResolvedValue({rows:[user]}); mocks.client.query.mockImplementation(async sql => ({rows:sql.includes('FOR UPDATE')?[{id:mapId,revision:0}]:[]})); });
it('rejects foreign-map IDs before any upsert', async () => {
  mocks.client.query.mockResolvedValueOnce({rows:[{id:mapId,revision:0}]}).mockResolvedValueOnce({rows:[{id:nodeId}]});
  const res = await request(app).post(`/maps/${mapId}/save`).set('Authorization',auth()).send({revision:0,nodes:[{id:nodeId,type:'note'}],edges:[]});
  expect(res.status).toBe(409);
  expect(mocks.client.query.mock.calls.some(([sql])=>sql.includes('INSERT INTO map_nodes'))).toBe(false);
});
it('rejects stale saves without overwriting the newer document', async () => {
  mocks.client.query.mockResolvedValueOnce({rows:[{id:mapId,revision:1}]});
  const res = await request(app).post(`/maps/${mapId}/save`).set('Authorization',auth()).send({revision:0,nodes:[],edges:[]});
  expect(res.status).toBe(409);
  expect(mocks.client.query.mock.calls).toHaveLength(1);
});
it('rejects edges pointing outside the submitted document', async () => {
  const res = await request(app).post(`/maps/${mapId}/save`).set('Authorization',auth()).send({revision:0,nodes:[],edges:[{id:edgeId,from:nodeId,to:nodeId}]});
  expect(res.status).toBe(400);
  expect(mocks.client.query).not.toHaveBeenCalled();
});
it('persists description and preserves groups when omitted', async () => {
  const res = await request(app).post(`/maps/${mapId}/save`).set('Authorization',auth()).send({revision:0,nodes:[{id:nodeId,type:'note',description:'Keep this'}],edges:[]});
  expect(res.status).toBe(200);
  const upsert=mocks.client.query.mock.calls.find(([sql])=>sql.includes('INSERT INTO map_nodes'));
  expect(upsert[1][14]).toBe('Keep this');
  const metadata=mocks.client.query.mock.calls.find(([sql])=>sql.includes('UPDATE maps SET'));
  expect(metadata[1][1]).toBeNull();
});
it('reproduces: empty save deletes removed nodes', async () => {
  const res=await request(app).post(`/maps/${mapId}/save`).set('Authorization',auth()).send({revision:0,nodes:[],edges:[]});
  expect(res.status).toBe(200);
  expect(mocks.client.query.mock.calls.some(([sql])=>sql.includes('DELETE FROM map_nodes'))).toBe(true);
});
it('reproduces: valid edge UUID is preserved', async () => {
  const res=await request(app).post(`/maps/${mapId}/save`).set('Authorization',auth()).send({revision:0,nodes:[{id:nodeId,type:'note',title:'Test'}],edges:[{id:edgeId,from:nodeId,to:nodeId}]});
  expect(res.status).toBe(200);
  const call=mocks.client.query.mock.calls.find(([sql])=>sql.includes('INSERT INTO map_edges'));
  expect(call[1][0]).toBe(edgeId);
});
it('reproduces: viewer cannot receive private notes or integration credentials', async () => {
  mocks.query.mockReset();
  mocks.query.mockResolvedValueOnce({rows:[{...user,role:'viewer'}]})
    .mockResolvedValueOnce({rows:[{owner_id:'other',permission:'viewer'}]})
    .mockResolvedValueOnce({rows:[{id:mapId}]})
    .mockResolvedValueOnce({rows:[{id:nodeId,notes_private:true,node_notes:'private synthetic note',properties:{_integration:{token:'synthetic-token'}}}]})
    .mockResolvedValueOnce({rows:[]}).mockResolvedValueOnce({rows:[]});
  const res=await request(app).get(`/maps/${mapId}`).set('Authorization',auth());
  expect(res.status).toBe(200);
  expect(res.body.nodes[0].node_notes).toBe('');
  expect(res.body.nodes[0].properties._integration.token).toBeUndefined();
});
it('reproduces: admin cannot reset an owner password', async () => {
  const ownerId='eeeeeeee-eeee-4eee-8eee-eeeeeeeeeeee';
  mocks.query.mockResolvedValueOnce({rows:[user]}).mockResolvedValueOnce({rows:[{role:'owner'}]});
  const res=await request(app).patch(`/users/${ownerId}`).set('Authorization',auth()).send({password:'synthetic-password'});
  expect(res.status).toBe(403);
  expect(mocks.query.mock.calls.some(([sql,params])=>sql.includes('UPDATE users SET password_hash')&&params.at(-1)===ownerId)).toBe(false);
});
it('reproduces: distinct refresh JWTs have different full-token hashes', async () => {
  const a=jwt.sign({sub:user.id,jti:'first-synthetic-token'},'audit-refresh-secret');
  const b=jwt.sign({sub:user.id,jti:'second-synthetic-token'},'audit-refresh-secret');
  expect(a).not.toBe(b);
  expect(a.slice(0,72)).toBe(b.slice(0,72));
  expect(hashRefreshToken(a)).not.toBe(hashRefreshToken(b));
});
