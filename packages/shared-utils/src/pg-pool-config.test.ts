import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { afterEach, describe, expect, it, vi } from 'vitest';

import { buildPgPoolConfig } from './pg-pool-config.js';

const thisDir = path.dirname(fileURLToPath(import.meta.url));
const apiRoot = path.join(thisDir, '../../../apps/api');

describe('buildPgPoolConfig', () => {
  const cwd = process.cwd();

  afterEach(() => {
    vi.unstubAllEnvs();
    process.chdir(cwd);
  });

  it('RDS hostname için ssl.ca ile pool config üretir (bundle dosyası varken)', () => {
    process.chdir(apiRoot);
    const url =
      'postgresql://u:p@db.xyz.eu-west-1.rds.amazonaws.com:5432/app?schema=public&sslmode=require';
    const cfg = buildPgPoolConfig(url);
    expect(cfg.connectionString).toContain('rds.amazonaws.com');
    expect(cfg.connectionString).not.toContain('sslmode');
    expect(cfg.ssl).toBeDefined();
    expect(typeof (cfg.ssl as { ca: string }).ca).toBe('string');
    expect((cfg.ssl as { ca: string }).ca.length).toBeGreaterThan(1000);
  });

  it('RDS hostname + cwd worker iken monorepo yolundan bundle bulur', () => {
    const workerRoot = path.join(thisDir, '../../../apps/worker');
    process.chdir(workerRoot);
    const url = 'postgresql://u:p@db.xyz.eu-west-1.rds.amazonaws.com:5432/app?schema=public';
    const cfg = buildPgPoolConfig(url);
    expect(cfg.ssl).toBeDefined();
    expect(typeof (cfg.ssl as { ca: string }).ca).toBe('string');
    expect((cfg.ssl as { ca: string }).ca.length).toBeGreaterThan(1000);
  });

  it('localhost için yalnızca connectionString döner', () => {
    process.chdir(apiRoot);
    const url = 'postgresql://leanmgmt:leanmgmt@127.0.0.1:5432/leanmgmt_dev?schema=public';
    const cfg = buildPgPoolConfig(url);
    expect(cfg).toEqual({ connectionString: url });
  });

  it('DATABASE_SSL_CA tanımlı ve dosya yoksa hata verir', () => {
    vi.stubEnv('DATABASE_SSL_CA', '/nonexistent/ca.pem');
    expect(() => buildPgPoolConfig('postgresql://u:p@host:5432/db')).toThrow(/DATABASE_SSL_CA/);
  });
});
