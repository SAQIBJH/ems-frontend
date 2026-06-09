import { EmployeeFormStepper } from '@/modules/employees';
import { RequirePermission } from '@/shared/guards';

export default function NewEmployeePage() {
  return (
    <RequirePermission
      permission="employees:write"
      backHref="/employees"
      backLabel="Back to Employees"
    >
      <EmployeeFormStepper />
    </RequirePermission>
  );
}
