import { EmployeeForm } from '@/modules/employees';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditEmployeePage({ params }: Props) {
  const { id } = await params;
  return <EmployeeForm mode="edit" employeeId={id} />;
}
