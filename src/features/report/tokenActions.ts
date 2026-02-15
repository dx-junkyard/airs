'use server';

import { generateReportToken } from '@/server/infrastructure/auth/reportToken';

/**
 * reportId からJWTトークンを生成するServer Action
 */
export async function generateReportTokenAction(
  reportId: string
): Promise<string> {
  return await generateReportToken(reportId);
}
