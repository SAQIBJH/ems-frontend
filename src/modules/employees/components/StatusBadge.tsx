import { Badge } from '@/components/ui/badge';
import { EMPLOYMENT_STATUS_LABELS } from '../constants';
import type { EmploymentStatus } from '../types/employee.types';

export function StatusBadge({ status }: { status: EmploymentStatus }) {
  if (status === 'ACTIVE') {
    return (
      <Badge
        variant="outline"
        className="border-success/40 bg-success/10 text-success text-[11px] font-medium"
      >
        {EMPLOYMENT_STATUS_LABELS.ACTIVE}
      </Badge>
    );
  }
  return (
    <Badge
      variant="outline"
      className="border-fg-disabled/40 bg-surface-2 text-fg-muted text-[11px] font-medium"
    >
      {EMPLOYMENT_STATUS_LABELS.TERMINATED}
    </Badge>
  );
}
