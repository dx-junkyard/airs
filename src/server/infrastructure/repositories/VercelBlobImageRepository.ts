import { put } from '@vercel/blob';
import type { IImageRepository } from '@/server/domain/repositories/IImageRepository';

/**
 * VercelBlobImageRepository
 *
 * Vercel Blob Storage を使用した画像リポジトリ実装
 */
class VercelBlobImageRepository implements IImageRepository {
  /**
   * 画像をVercel BlobにアップロードしてURLを取得
   */
  async upload(file: File | Blob, filename: string): Promise<string> {
    const blob = await put(filename, file, {
      access: 'public',
      addRandomSuffix: true,
    });
    return blob.url;
  }

  /**
   * 画像URLが有効かどうかを確認
   */
  async exists(url: string): Promise<boolean> {
    try {
      const response = await fetch(url, { method: 'HEAD' });
      return response.ok;
    } catch {
      return false;
    }
  }
}

export default VercelBlobImageRepository;
