import { PayrollRunDetail } from '@/modules/payroll/components/PayrollRunDetail';

interface Props {
  params: Promise<{ runId: string }>;
}

export default async function PayrollRunPage({ params }: Props) {
  const { runId } = await params;
  return <PayrollRunDetail runId={runId} />;
}
