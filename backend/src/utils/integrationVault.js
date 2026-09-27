import { createCipheriv, createDecipheriv, randomBytes, randomUUID } from 'node:crypto';
import { query } from '../db/pool.js';

function key() {
  const value = process.env.INTEGRATION_ENCRYPTION_KEY;
  if (!/^[0-9a-f]{64}$/i.test(value || '')) throw Object.assign(new Error('Integration storage requires INTEGRATION_ENCRYPTION_KEY (64 hex characters)'), { status: 503 });
  return Buffer.from(value, 'hex');
}
export function sealConfig(config) {
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key(), iv);
  const data = Buffer.concat([cipher.update(JSON.stringify(config), 'utf8'), cipher.final()]);
  return Buffer.concat([iv, cipher.getAuthTag(), data]).toString('base64');
}
export function openConfig(value) {
  const data = Buffer.from(value, 'base64');
  const cipher = createDecipheriv('aes-256-gcm', key(), data.subarray(0,12));
  cipher.setAuthTag(data.subarray(12,28));
  return JSON.parse(Buffer.concat([cipher.update(data.subarray(28)), cipher.final()]).toString('utf8'));
}
export async function canUseMap(user, mapId, run = query) {
  const { rows } = await run(`SELECT m.owner_id, mc.permission FROM maps m
    LEFT JOIN map_collaborators mc ON mc.map_id=m.id AND mc.user_id=$2 WHERE m.id=$1`, [mapId,user.id]);
  return !!rows[0] && (['owner','admin'].includes(user.role) || rows[0].owner_id === user.id || ['owner','admin','editor'].includes(rows[0].permission));
}
export async function storeConfig(config, userId, mapId = null, run = query) {
  const credentialId = randomUUID();
  await run('INSERT INTO integration_credentials (id,owner_id,map_id,config_ciphertext) VALUES ($1,CASE WHEN $3::uuid IS NULL THEN $2::uuid ELSE (SELECT owner_id FROM maps WHERE id=$3) END,$3,$4)',
    [credentialId,userId,mapId,sealConfig(config)]);
  return { credentialId, type:config.type, url:config.url };
}
export async function resolveConfig(id, user, run = query) {
  const {rows} = await run('SELECT owner_id,map_id,config_ciphertext FROM integration_credentials WHERE id=$1',[id]);
  const row = rows[0];
  if (!row || (row.map_id ? !await canUseMap(user,row.map_id,run) : row.owner_id !== user.id)) {
    throw Object.assign(new Error('Integration access denied'),{status:403});
  }
  return openConfig(row.config_ciphertext);
}
export async function protectProperties(properties, userId, mapId, run = query) {
  const config = properties?._integration;
  if (!config || config.credentialId) return properties || {};
  if (!config.url) return { ...properties, _integration: {} };
  return { ...properties, _integration: await storeConfig(config,userId,mapId,run) };
}
