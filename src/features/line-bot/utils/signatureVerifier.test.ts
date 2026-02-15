import crypto from 'crypto';
import { describe, expect, it } from 'vitest';

import { verifyLineSignature } from '@/features/line-bot/utils/signatureVerifier';

const SECRET = 'test-channel-secret';

function computeSignature(body: string, secret: string): string {
  return crypto.createHmac('SHA256', secret).update(body).digest('base64');
}

describe('verifyLineSignature', () => {
  it('returns true for a valid signature', () => {
    const body = '{"events":[]}';
    const signature = computeSignature(body, SECRET);
    expect(verifyLineSignature(body, signature, SECRET)).toBe(true);
  });

  it('returns false for an invalid signature', () => {
    const body = '{"events":[]}';
    const wrongSignature = computeSignature('different-body', SECRET);
    expect(verifyLineSignature(body, wrongSignature, SECRET)).toBe(false);
  });

  it('returns false for a tampered body', () => {
    const body = '{"events":[]}';
    const signature = computeSignature(body, SECRET);
    expect(verifyLineSignature(body + 'x', signature, SECRET)).toBe(false);
  });

  it('returns true for an empty body with correct signature', () => {
    const body = '';
    const signature = computeSignature(body, SECRET);
    expect(verifyLineSignature(body, signature, SECRET)).toBe(true);
  });

  it('throws for mismatched buffer lengths (completely wrong signature)', () => {
    const body = '{"events":[]}';
    // A base64 string of different length than the expected HMAC digest
    expect(() =>
      verifyLineSignature(body, 'short', SECRET)
    ).toThrow();
  });
});
