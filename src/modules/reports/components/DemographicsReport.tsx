'use client';

import { useState } from 'react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { DonutChart } from '@/shared/engines/ChartEngine';
import { useDepartments, flattenDepartmentTree } from '@/modules/departments';
import { useDemographicsReport } from '../hooks/useWorkforceReports';
import { ReportShell } from './ReportShell';

const EMPLOYMENT_TYPE_COLORS: Record<string, string> = {
  FULL_TIME: 'hsl(222 80% 52%)',
  CONTRACT: 'hsl(38 92% 50%)',
  PART_TIME: 'hsl(152 60% 40%)',
  INTERNSHIP: 'hsl(280 65% 55%)',
};

const GENDER_COLORS: Record<string, string> = {
  MALE: 'hsl(222 80% 52%)',
  FEMALE: 'hsl(0 75% 55%)',
  OTHER: 'hsl(38 92% 50%)',
};

const DEPT_PALETTE = [
  'hsl(222 80% 52%)',
  'hsl(152 60% 40%)',
  'hsl(38 92% 50%)',
  'hsl(280 65% 55%)',
  'hsl(0 75% 50%)',
  'hsl(190 70% 45%)',
  'hsl(320 60% 50%)',
];

export default function DemographicsReport() {
  const [deptId, setDeptId] = useState('');

  const { data: departments = [] } = useDepartments();
  const flatDepts = flattenDepartmentTree(departments);

  const params = { departmentId: deptId || undefined };
  const { data, isLoading, isError, refetch } = useDemographicsReport(params);

  const filterBar = (
    <div className="flex flex-wrap items-center gap-3">
      <Select
        value={deptId || '_all'}
        onValueChange={(v) => setDeptId(v === '_all' ? '' : (v ?? ''))}
      >
        <SelectTrigger className="h-8 w-48 text-sm">
          <SelectValue>
            {(v: string) =>
              v === '_all' ? 'All departments' : (flatDepts.find((d) => d.id === v)?.name ?? v)
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="_all">All departments</SelectItem>
          {flatDepts.map((d) => (
            <SelectItem key={d.id} value={d.id}>
              {d.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );

  if (isError) {
    return (
      <ReportShell
        title="Demographics"
        description="Workforce breakdown by employment type, gender, and department."
        filterBar={filterBar}
        isError
        onRetry={refetch}
      />
    );
  }

  if (isLoading) {
    return (
      <ReportShell
        title="Demographics"
        description="Workforce breakdown by employment type, gender, and department."
        filterBar={filterBar}
        isLoading
      />
    );
  }

  const employmentTypeSlices = (data?.byEmploymentType ?? []).map((item, i) => ({
    name: item.type.replace(/_/g, ' '),
    value: item.count,
    color: EMPLOYMENT_TYPE_COLORS[item.type] ?? DEPT_PALETTE[i % DEPT_PALETTE.length],
  }));

  const deptSlices = (data?.byDepartment ?? []).map((item, i) => ({
    name: item.departmentName,
    value: item.count,
    color: DEPT_PALETTE[i % DEPT_PALETTE.length],
  }));

  const genderSlices = (data?.byGender ?? []).map((item, i) => ({
    name: item.gender.charAt(0) + item.gender.slice(1).toLowerCase(),
    value: item.count,
    color: GENDER_COLORS[item.gender] ?? DEPT_PALETTE[i % DEPT_PALETTE.length],
  }));

  const chart = (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
      {[
        { title: 'By Employment Type', slices: employmentTypeSlices },
        { title: 'By Department', slices: deptSlices },
        { title: 'By Gender', slices: genderSlices },
      ].map(({ title, slices }) => (
        <div key={title} className="rounded-lg border border-subtle bg-surface p-4">
          <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-fg-muted">
            {title}
          </p>
          {slices.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-fg-muted">
              No data
            </div>
          ) : (
            <DonutChart data={slices} height={220} innerRadius={50} outerRadius={80} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <ReportShell
      title="Demographics"
      description="Workforce breakdown by employment type, gender, and department."
      filterBar={filterBar}
      chart={chart}
    />
  );
}
