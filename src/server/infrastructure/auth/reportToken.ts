import { SignJWT, jwtVerify } from 'jose';

interface ReportTokenPayload {
  reportId: string;
}

function getSecret(): Uint8Array {
  const secret = process.env.REPORT_TOKEN_SECRET;
  if (!secret) {
    throw new Error('REPORT_TOKEN_SECRET environment variable is not set');
  }
  return new TextEncoder().encode(secret);
}

/**
 * reportId を含むJWTトークンを生成する（有効期限なし）
 */
export async function generateReportToken(
  reportId: string
): Promise<string> {
  const secret = getSecret();
  return await new SignJWT({ reportId })
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .sign(secret);
}

/**
 * JWTトークンを検証し、reportId を返す
 */
export async function verifyReportToken(
  token: string
): Promise<ReportTokenPayload> {
  const secret = getSecret();
  const { payload } = await jwtVerify(token, secret);

  const reportId = payload.reportId;
  if (typeof reportId !== 'string') {
    throw new Error('Invalid token payload: reportId is missing');
  }

  return { reportId };
}
