import { beforeEach, describe, expect, it, vi } from 'vitest';
import { Readable } from 'stream';

// Mock DIContainer
const mockUpload = vi.fn().mockResolvedValue('https://blob.example.com/line_img.jpg');

vi.mock('@/server/infrastructure/di/container', () => ({
  default: {
    getImageRepository: vi.fn(() => ({
      upload: mockUpload,
    })),
  },
}));

import { uploadLineImage } from '@/features/line-bot/services/LineImageService';

describe('uploadLineImage', () => {
  const mockLineClient = {
    getMessageContent: vi.fn(),
  } as unknown as import('@/server/infrastructure/line/LineMessagingClient').default;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('downloads image from LINE API, uploads to Blob, and returns URL', async () => {
    // Create a readable stream with test image data
    const testBuffer = Buffer.from('fake-image-data');
    const stream = Readable.from([testBuffer]);

    (mockLineClient.getMessageContent as ReturnType<typeof vi.fn>).mockResolvedValue(stream);

    const url = await uploadLineImage('msg-123', mockLineClient);

    expect(mockLineClient.getMessageContent).toHaveBeenCalledWith('msg-123');
    expect(mockUpload).toHaveBeenCalledWith(
      expect.any(Blob),
      expect.stringMatching(/^line_msg-123_\d+\.jpg$/)
    );
    expect(url).toBe('https://blob.example.com/line_img.jpg');
  });

  it('handles multiple chunks from the stream', async () => {
    const chunk1 = Buffer.from('chunk1');
    const chunk2 = Buffer.from('chunk2');
    const stream = Readable.from([chunk1, chunk2]);

    (mockLineClient.getMessageContent as ReturnType<typeof vi.fn>).mockResolvedValue(stream);

    const url = await uploadLineImage('msg-456', mockLineClient);

    expect(url).toBe('https://blob.example.com/line_img.jpg');
    // Verify that upload was called with a Blob and correct filename
    expect(mockUpload).toHaveBeenCalledWith(
      expect.any(Blob),
      expect.stringMatching(/^line_msg-456_\d+\.jpg$/)
    );
  });
});
