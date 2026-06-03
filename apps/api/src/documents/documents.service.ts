import { Inject, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'node:crypto';

import type { DocumentCreateInput, DocumentUploadInitiateInput } from '@leanmgmt/shared-schemas';

import type { AuthenticatedUser } from '../common/decorators/current-user.decorator.js';
import type { Env } from '../config/env.schema.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { RedisService } from '../redis/redis.service.js';

import { DocumentScanQueueService } from './document-scan-queue.service.js';
import {
  DocumentInfectedException,
  DocumentInitiateExpiredException,
  DocumentNotFoundException,
  DocumentScanPendingException,
  DocumentUploadForbiddenException,
} from './documents.exceptions.js';
import type { DocumentsObjectStorage } from './documents-object-storage.js';
import {
  NoopDocumentsObjectStorage,
  S3DocumentsObjectStorage,
} from './documents-object-storage.js';

const INIT_TTL_SEC = 900;
const PRESIGN_PUT_TTL_SEC = 300;
const PRESIGN_GET_TTL_SEC = 300;

function redisInitKey(documentId: string): string {
  return `doc:upload:init:${documentId}`;
}

type InitPayload = {
  uploadedByUserId: string;
  filename: string;
  contentType: string;
  fileSizeBytes: number;
};

export function buildStagingObjectKey(documentId: string, filename: string): string {
  const safe = filename.replace(/[/\\]/g, '_').replace(/\.\./g, '_').replace(/\0/g, '');
  return `staging/${documentId}-${safe}`;
}

@Injectable()
export class DocumentsService {
  private readonly storage: DocumentsObjectStorage;

  constructor(
    @Inject(PrismaService) private readonly prisma: PrismaService,
    @Inject(RedisService) private readonly redis: RedisService,
    @Inject(ConfigService) private readonly config: ConfigService<Env, true>,
    @Inject(DocumentScanQueueService) private readonly scanQueue: DocumentScanQueueService,
  ) {
    const driver = this.config.get('DOCUMENTS_STORAGE_DRIVER', { infer: true });
    this.storage =
      driver === 'noop'
        ? new NoopDocumentsObjectStorage()
        : new S3DocumentsObjectStorage({
            AWS_REGION: this.config.get('AWS_REGION', { infer: true }),
            AWS_ACCESS_KEY_ID: this.config.get('AWS_ACCESS_KEY_ID', { infer: true }),
            AWS_SECRET_ACCESS_KEY: this.config.get('AWS_SECRET_ACCESS_KEY', { infer: true }),
            S3_ENDPOINT_URL: this.config.get('S3_ENDPOINT_URL', { infer: true }),
            S3_DOCUMENTS_BUCKET: this.config.get('S3_DOCUMENTS_BUCKET', { infer: true }) as string,
          });
  }

  async initiateUpload(
    body: DocumentUploadInitiateInput,
    actor: AuthenticatedUser,
  ): Promise<{
    documentId: string;
    uploadUrl: string;
    uploadMethod: 'PUT';
    uploadHeaders: Record<string, string>;
    expiresAt: string;
  }> {
    const documentId = randomUUID();
    const s3Key = buildStagingObjectKey(documentId, body.filename);
    const payload: InitPayload = {
      uploadedByUserId: actor.id,
      filename: body.filename,
      contentType: body.contentType,
      fileSizeBytes: body.fileSizeBytes,
    };
    await this.redis.raw.setex(redisInitKey(documentId), INIT_TTL_SEC, JSON.stringify(payload));
    const { url, headers } = await this.storage.getPresignedPutUrl(
      s3Key,
      body.contentType,
      PRESIGN_PUT_TTL_SEC,
    );
    const expiresAt = new Date(Date.now() + PRESIGN_PUT_TTL_SEC * 1000).toISOString();
    return {
      documentId,
      uploadUrl: url,
      uploadMethod: 'PUT',
      uploadHeaders: headers,
      expiresAt,
    };
  }

  async completeUpload(
    body: DocumentCreateInput,
    actor: AuthenticatedUser,
  ): Promise<{
    id: string;
    filename: string;
    contentType: string;
    fileSizeBytes: number;
    scanStatus: string;
    uploadedAt: string;
  }> {
    const raw = await this.redis.raw.get(redisInitKey(body.documentId));
    if (!raw) {
      throw new DocumentInitiateExpiredException();
    }
    const init = JSON.parse(raw) as InitPayload;
    if (init.uploadedByUserId !== actor.id) {
      throw new DocumentUploadForbiddenException();
    }
    if (
      init.filename !== body.filename ||
      init.contentType !== body.contentType ||
      init.fileSizeBytes !== body.fileSizeBytes
    ) {
      throw new DocumentInitiateExpiredException();
    }

    const s3Key = buildStagingObjectKey(body.documentId, body.filename);
    await this.storage.assertStagingObjectExists(s3Key, body.contentType, body.fileSizeBytes);

    const doc = await this.prisma.document.create({
      data: {
        id: body.documentId,
        uploadedByUserId: actor.id,
        s3Key,
        originalFilename: body.filename,
        fileSizeBytes: BigInt(body.fileSizeBytes),
        contentType: body.contentType,
        scanStatus: 'PENDING_SCAN',
      },
    });
    await this.redis.raw.del(redisInitKey(body.documentId));
    await this.scanQueue.enqueueScan(doc.id);
    return {
      id: doc.id,
      filename: doc.originalFilename,
      contentType: doc.contentType,
      fileSizeBytes: Number(doc.fileSizeBytes),
      scanStatus: doc.scanStatus,
      uploadedAt: doc.uploadedAt.toISOString(),
    };
  }

  private async assertDocumentReadable(actor: AuthenticatedUser, docId: string) {
    const doc = await this.prisma.document.findUnique({
      where: { id: docId },
    });
    if (!doc) {
      throw new DocumentNotFoundException();
    }
    if (doc.uploadedByUserId === actor.id) {
      return doc;
    }
    throw new DocumentUploadForbiddenException();
  }

  async getMeta(
    actor: AuthenticatedUser,
    docId: string,
  ): Promise<{
    id: string;
    filename: string;
    contentType: string;
    fileSizeBytes: number;
    scanStatus: string;
    scanResultDetail: string | null;
    uploadedAt: string;
  }> {
    const doc = await this.assertDocumentReadable(actor, docId);
    return {
      id: doc.id,
      filename: doc.originalFilename,
      contentType: doc.contentType,
      fileSizeBytes: Number(doc.fileSizeBytes),
      scanStatus: doc.scanStatus,
      scanResultDetail: doc.scanResultDetail,
      uploadedAt: doc.uploadedAt.toISOString(),
    };
  }

  async getScanStatus(
    actor: AuthenticatedUser,
    docId: string,
  ): Promise<{ id: string; scanStatus: string; scanResultDetail: string | null }> {
    const doc = await this.assertDocumentReadable(actor, docId);
    return {
      id: doc.id,
      scanStatus: doc.scanStatus,
      scanResultDetail: doc.scanResultDetail,
    };
  }

  async getDownloadUrl(
    actor: AuthenticatedUser,
    docId: string,
  ): Promise<{ downloadUrl: string; expiresAt: string }> {
    const doc = await this.assertDocumentReadable(actor, docId);
    if (doc.scanStatus === 'PENDING_SCAN' || doc.scanStatus === 'SCANNING') {
      throw new DocumentScanPendingException();
    }
    if (doc.scanStatus === 'INFECTED') {
      throw new DocumentInfectedException();
    }
    if (doc.scanStatus !== 'CLEAN') {
      throw new DocumentScanPendingException();
    }
    const expiresAt = new Date(Date.now() + PRESIGN_GET_TTL_SEC * 1000).toISOString();
    const downloadUrl = await this.storage.getPresignedGetUrl(
      doc.s3Key,
      doc.originalFilename,
      PRESIGN_GET_TTL_SEC,
    );
    return { downloadUrl, expiresAt };
  }
}
