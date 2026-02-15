import { notFound, redirect } from 'next/navigation';
import { verifyReportToken } from '@/server/infrastructure/auth/reportToken';
import { getReport } from '@/features/report/actions';
import { getEnabledAnimalTypes } from '@/features/system-setting/actions';
import ReportEditClient from './ReportEditClient';

export const dynamic = 'force-dynamic';

interface PageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function ReportPage({ searchParams }: PageProps) {
  const { token } = await searchParams;

  if (!token) {
    redirect('/admin/report');
  }

  let reportId: string;
  try {
    const payload = await verifyReportToken(token);
    reportId = payload.reportId;
  } catch {
    notFound();
  }

  const [report, enabledAnimalTypes] = await Promise.all([
    getReport(reportId),
    getEnabledAnimalTypes(),
  ]);

  if (!report) {
    notFound();
  }

  return <ReportEditClient report={report} token={token} enabledAnimalTypes={enabledAnimalTypes} />;
}
