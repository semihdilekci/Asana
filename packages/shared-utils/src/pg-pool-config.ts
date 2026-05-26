import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import type { PoolConfig } from 'pg';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** `apps/api/certs` — API dışındaki süreçler (worker) cwd farklı olsa da bundle bulunabilsin */
function awsRdsGlobalBundleCandidates(): string[] {
  const fromCwd = path.join(process.cwd(), 'certs', 'aws-rds-global-bundle.pem');
  // dist: packages/shared-utils/dist → repo kökü; src (vitest): packages/shared-utils/src → repo kökü
  const fromMonorepo = path.join(__dirname, '../../../apps/api/certs/aws-rds-global-bundle.pem');
  return [fromCwd, fromMonorepo];
}

function resolveAwsRdsGlobalBundlePath(): string {
  for (const candidate of awsRdsGlobalBundleCandidates()) {
    if (fs.existsSync(candidate)) {
      return candidate;
    }
  }
  throw new Error(
    `RDS TLS: CA paketi bulunamadı (denenen: ${awsRdsGlobalBundleCandidates().join(', ')}). ` +
      `apps/api/certs/aws-rds-global-bundle.pem dosyasını ekleyin veya DATABASE_SSL_CA ile özel CA yolu verin — apps/api/certs/README.md`,
  );
}

/** `sslmode` URL’de kalırsa pg bunu verify-full ile birleştirip CA’yı yok sayabiliyor; CA’yı `PoolConfig.ssl` ile veriyoruz */
function stripSslSearchParams(connectionString: string): string {
  try {
    const normalized = connectionString.replace(/^postgresql:\/\//, 'postgres://');
    const u = new URL(normalized);
    for (const key of [
      'sslmode',
      'sslrootcert',
      'sslcert',
      'sslkey',
      'sslidentity',
      'sslpassword',
    ]) {
      u.searchParams.delete(key);
    }
    return u.toString().replace(/^postgres:\/\//, 'postgresql://');
  } catch {
    return connectionString;
  }
}

function hostnameLooksLikeRds(connectionString: string): boolean {
  try {
    const normalized = connectionString.replace(/^postgresql:\/\//, 'postgres://');
    const { hostname } = new URL(normalized);
    return hostname.endsWith('.rds.amazonaws.com');
  } catch {
    return false;
  }
}

/**
 * Prisma 7 + `pg`: RDS TLS zinciri Node varsayılan CA ile tam uyuşmayabiliyor; AWS global bundle gerekir.
 * Yerel Postgres (Docker) için `ssl` eklenmez — URL’deki parametreler yeter.
 * Worker `process.cwd()` farklı olduğundan RDS bundle monorepo yolundan da aranır.
 */
export function buildPgPoolConfig(connectionString: string): PoolConfig {
  const explicitCa = process.env.DATABASE_SSL_CA;
  if (explicitCa) {
    const resolved = path.isAbsolute(explicitCa)
      ? explicitCa
      : path.join(process.cwd(), explicitCa);
    if (!fs.existsSync(resolved)) {
      throw new Error(`DATABASE_SSL_CA dosyası bulunamadı: ${resolved}`);
    }
    return {
      connectionString: stripSslSearchParams(connectionString),
      ssl: { ca: fs.readFileSync(resolved, 'utf8'), rejectUnauthorized: true },
    };
  }

  if (hostnameLooksLikeRds(connectionString)) {
    const bundlePath = resolveAwsRdsGlobalBundlePath();
    return {
      connectionString: stripSslSearchParams(connectionString),
      ssl: { ca: fs.readFileSync(bundlePath, 'utf8'), rejectUnauthorized: true },
    };
  }

  return { connectionString };
}
