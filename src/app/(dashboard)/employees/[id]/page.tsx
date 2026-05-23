import { EmployeeProfile } from '@/modules/employees';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EmployeeProfilePage({ params }: Props) {
  const { id } = await params;
  return <EmployeeProfile id={id} />;
}
