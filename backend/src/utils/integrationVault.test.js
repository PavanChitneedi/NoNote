import { afterEach, expect, it, vi } from 'vitest';
vi.mock('../db/pool.js',()=>({query:vi.fn()}));
import { sealConfig, openConfig, resolveConfig, protectProperties } from './integrationVault.js';
afterEach(()=>vi.unstubAllEnvs());
const configure = () => vi.stubEnv('INTEGRATION_ENCRYPTION_KEY','12'.repeat(32));
it('encrypts credentials independently of JWT rotation and detects tampering',()=>{
  configure();
  const config={url:'https://host.example',token:'private-token',type:'proxmox'};
  const encrypted=sealConfig(config);
  expect(encrypted).not.toContain(config.token);
  vi.stubEnv('JWT_ACCESS_SECRET','rotated');
  expect(openConfig(encrypted)).toEqual(config);
  const bytes=Buffer.from(encrypted,'base64'); bytes[30]^=1;
  expect(()=>openConfig(bytes.toString('base64'))).toThrow();
});
it('refuses to store secrets without an encryption key',()=>{
  vi.stubEnv('INTEGRATION_ENCRYPTION_KEY','');
  expect(()=>sealConfig({token:'secret'})).toThrow('INTEGRATION_ENCRYPTION_KEY');
});
it('denies standalone references to other users',async()=>{
  const run=vi.fn().mockResolvedValue({rows:[{owner_id:'other',map_id:null}]});
  await expect(resolveConfig('id',{id:'viewer',role:'admin'},run)).rejects.toMatchObject({status:403});
});
it('rechecks map permission rather than trusting ownership of the reference',async()=>{
  const run=vi.fn().mockResolvedValueOnce({rows:[{owner_id:'viewer',map_id:'map'}]})
    .mockResolvedValueOnce({rows:[{owner_id:'other',permission:'viewer'}]});
  await expect(resolveConfig('id',{id:'viewer',role:'editor'},run)).rejects.toMatchObject({status:403});
});
it('resolves the stored destination without caller credentials',async()=>{
  configure();
  const config={url:'https://fixed.example',token:'secret',type:'proxmox'};
  const run=vi.fn().mockResolvedValueOnce({rows:[{owner_id:'user',map_id:null,config_ciphertext:sealConfig(config)}]});
  expect(await resolveConfig('id',{id:'user',role:'viewer'},run)).toEqual(config);
});
it('replaces legacy credentials with references without mutating input',async()=>{
  configure();
  const props={label:'keep',_integration:{url:'https://host.example',type:'proxmox',token:'secret'}};
  const run=vi.fn().mockResolvedValue({rows:[]});
  const output=await protectProperties(props,'user','map',run);
  expect(output._integration.credentialId).toBeTruthy();
  expect(JSON.stringify(output)).not.toContain('secret');
  expect(props._integration.token).toBe('secret');
  expect(openConfig(run.mock.calls[0][1][3])).toEqual(props._integration);
});
