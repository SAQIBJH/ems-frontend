import { EmployeeForm } from '@/modules/employees';
import { RequirePermission } from '@/shared/guards';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function EditEmployeePage({ params }: Props) {
  const { id } = await params;
  return (
    <RequirePermission
      permission="employees:write"
      backHref={`/employees/${id}`}
      backLabel="Back to profile"
    >
      <EmployeeForm mode="edit" employeeId={id} />
    </RequirePermission>
  );
}
