import { Storage } from '@google-cloud/storage';
import crypto from 'crypto';
import path from 'path';
import type { IImageRepository } from '@/server/domain/repositories/IImageRepository';

/**
 * GcsImageRepository
 *
 * Google Cloud Storage を使用した画像リポジトリ実装
 */
class GcsImageRepository implements IImageRepository {
  private storage: Storage;
  private bucketName: string;

  constructor() {
    const projectId = process.env.GCS_PROJECT_ID;
    const bucketName = process.env.GCS_BUCKET_NAME;

    if (!bucketName) {
      throw new Error(
        'GCS_BUCKET_NAME 環境変数が設定されていません'
      );
    }

    this.bucketName = bucketName;
    this.storage = new Storage({
      ...(projectId ? { projectId } : {}),
    });
  }

  /**
   * 画像をGoogle Cloud StorageにアップロードしてURLを取得
   */
  async upload(file: File | Blob, filename: string): Promise<string> {
    const bucket = this.storage.bucket(this.bucketName);
    const ext = path.extname(filename);
    const baseName = path.basename(filename, ext);
    const randomSuffix = crypto.randomUUID().slice(0, 8);
    const destination = `reports/${baseName}-${randomSuffix}${ext}`;

    const gcsFile = bucket.file(destination);
    const buffer = Buffer.from(await file.arrayBuffer());

    await gcsFile.save(buffer, {
      contentType:
        file instanceof File ? file.type : 'application/octet-stream',
    });

    return `https://storage.googleapis.com/${this.bucketName}/${destination}`;
  }

  /**
   * 画像URLが有効かどうかを確認
   */
  async exists(url: string): Promise<boolean> {
    try {
      const gcsPrefix = `https://storage.googleapis.com/${this.bucketName}/`;
      if (url.startsWith(gcsPrefix)) {
        const filePath = url.slice(gcsPrefix.length);
        const [exists] = await this.storage
          .bucket(this.bucketName)
          .file(filePath)
          .exists();
        return exists;
      }

      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default GcsImageRepository;
