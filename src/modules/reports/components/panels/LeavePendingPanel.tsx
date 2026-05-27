'use client';

import { ReportPlaceholder } from '../ReportPlaceholder';

export default function LeavePendingPanel() {
  return (
    <ReportPlaceholder
      title="Pending Leave Requests"
      description="All open leave requests awaiting approval across the organization."
    />
  );
}
