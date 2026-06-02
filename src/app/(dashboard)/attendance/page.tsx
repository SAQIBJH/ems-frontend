'use client';

import { useState } from 'react';
import { addMonths, format, parseISO, startOfMonth, subMonths } from 'date-fns';
import {
  CalendarIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  FileEditIcon,
  TableIcon,
} from 'lucide-react';
import { parseAsString, useQueryState } from 'nuqs';
import { useQuery } from '@tanstack/react-query';

import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { PageHeader } from '@/shared/layouts/PageHeader';
import { useAuth } from '@/providers';
import { useDepartments, flattenDepartmentTree } from '@/modules/departments';
import { employeesApi } from '@/modules/employees';
import { dashboardApi } from '@/modules/dashboard/services/dashboard.api';
import {
  AttendanceCalendar,
  AttendanceSummaryCards,
  CheckInOutCard,
  RegularizationDialog,
} from '@/modules/attendance';
import { AttendanceTableView } from '@/modules/attendance/components/AttendanceTableView';
import { DayDetailDrawer } from '@/modules/attendance/components/DayDetailDrawer';
import type { AttendanceRecord } from '@/modules/attendance';

export default function AttendancePage() {
  const { user } = useAuth();
  const [regularizationOpen, setRegularizationOpen] = useState(false);
  const [regularizationDate, setRegularizationDate] = useState<string | undefined>(undefined);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerDate, setDrawerDate] = useState<string | null>(null);
  const [drawerRecord, setDrawerRecord] = useState<AttendanceRecord | null>(null);

  const [view, setView] = useQueryState('view', parseAsString.withDefault('calendar'));
  const [month, setMonth] = useQueryState(
    'month',
    parseAsString.withDefault(format(new Date(), 'yyyy-MM')),
  );
  const [deptId, setDeptId] = useQueryState('deptId', parseAsString.withDefault(''));
  const [empId, setEmpId] = useQueryState('empId', parseAsString.withDefault(''));

  const isHrOrAdmin = user?.memberType === 'HR_ADMIN' || user?.memberType === 'SUPER_ADMIN';
  const isManager = user?.memberType === 'MANAGER';
  const showFilters = isHrOrAdmin || isManager;

  const currentDate = month ? startOfMonth(parseISO(`${month}-01`)) : startOfMonth(new Date());

  // Departments for filter dropdown (HR/Manager only)
  const { data: departments = [] } = useDepartments();
  const flatDepts = flattenDepartmentTree(departments);

  // HR: fetch employees filtered by selected department
  const { data: hrEmployeesPage } = useQuery({
    queryKey: ['employees', { departmentId: deptId || undefined, limit: 100 }],
    queryFn: () => employeesApi.list({ departmentId: deptId || undefined, limit: 100, page: 1 }),
    enabled: isHrOrAdmin,
    staleTime: 60_000,
  });

  // Manager: fetch own team
  const { data: managerTeam } = useQuery({
    queryKey: ['manager', 'team'],
    queryFn: dashboardApi.getManagerTeam,
    enabled: isManager,
    staleTime: 60_000,
  });

  const employeeOptions: { id: string; name: string }[] = isHrOrAdmin
    ? (hrEmployeesPage?.data ?? []).map((e) => ({
        id: e.id,
        name: `${e.firstName} ${e.lastName}`,
      }))
    : isManager
      ? (managerTeam ?? []).map((m) => ({
          id: m.id,
          name: `${m.firstName} ${m.lastName}`,
        }))
      : [];

  function handleDayClick(date: string, record: AttendanceRecord | null) {
    setDrawerDate(date);
    setDrawerRecord(record);
    setDrawerOpen(true);
  }

  function handleRequestRegularization(date: string) {
    setRegularizationDate(date);
    setRegularizationOpen(true);
  }

  function navigateMonth(direction: 1 | -1) {
    const next = direction === 1 ? addMonths(currentDate, 1) : subMonths(currentDate, 1);
    setMonth(format(next, 'yyyy-MM'));
    // Clear employee filter when changing month
  }

  const attendanceParams = {
    month,
    limit: 20,
    employeeId: empId || undefined,
    departmentId: deptId || undefined,
  };

  return (
    <>
      <PageHeader
        title="Attendance"
        description="Track check-in, check-out, and monthly records."
        breadcrumbs={[{ label: 'Attendance' }]}
        actions={
          <Button
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => {
              setRegularizationDate(undefined);
              setRegularizationOpen(true);
            }}
          >
            <FileEditIcon className="size-4" aria-hidden />
            Request Regularization
          </Button>
        }
      />

      <div className="flex flex-col gap-6 p-6">
        <AttendanceSummaryCards />

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Department filter — HR/Manager only */}
          {showFilters && flatDepts.length > 0 && (
            <Select
              value={deptId || '__all__'}
              onValueChange={(v) => {
                setDeptId(v === '__all__' ? '' : (v ?? ''));
                setEmpId(''); // reset employee when dept changes
              }}
            >
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue placeholder="All departments">
                  {(v) =>
                    v === '__all__'
                      ? 'All departments'
                      : (flatDepts.find((d) => d.id === v)?.name ?? 'All departments')
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All departments</SelectItem>
                {flatDepts.map((d) => (
                  <SelectItem key={d.id} value={d.id}>
                    {d.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Employee filter — HR/Manager only */}
          {showFilters && (
            <Select
              value={empId || '__all__'}
              onValueChange={(v) => setEmpId(v === '__all__' ? '' : (v ?? ''))}
            >
              <SelectTrigger className="h-8 w-44 text-xs">
                <SelectValue placeholder="All employees">
                  {(v) =>
                    v === '__all__'
                      ? 'All employees'
                      : (employeeOptions.find((e) => e.id === v)?.name ?? 'All employees')
                  }
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All employees</SelectItem>
                {employeeOptions.map((e) => (
                  <SelectItem key={e.id} value={e.id}>
                    {e.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          {/* Spacer */}
          <div className="flex-1" />

          {/* Month navigation */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => navigateMonth(-1)}
              aria-label="Previous month"
            >
              <ChevronLeftIcon className="size-4" />
            </Button>
            <span className="min-w-[110px] text-center text-sm font-medium text-fg">
              {format(currentDate, 'MMMM yyyy')}
            </span>
            <Button
              variant="ghost"
              size="icon-sm"
              onClick={() => navigateMonth(1)}
              aria-label="Next month"
            >
              <ChevronRightIcon className="size-4" />
            </Button>
          </div>

          {/* View toggle */}
          <div className="flex items-center rounded-md border border-subtle">
            <button
              type="button"
              onClick={() => setView('calendar')}
              className={`flex h-8 items-center gap-1.5 rounded-l-md px-3 text-xs font-medium transition-colors ${
                view === 'calendar'
                  ? 'bg-surface-2 text-fg'
                  : 'text-fg-muted hover:bg-surface-2/60 hover:text-fg'
              }`}
              aria-pressed={view === 'calendar'}
            >
              <CalendarIcon className="size-3.5" aria-hidden />
              Calendar
            </button>
            <button
              type="button"
              onClick={() => setView('table')}
              className={`flex h-8 items-center gap-1.5 rounded-r-md border-l border-subtle px-3 text-xs font-medium transition-colors ${
                view === 'table'
                  ? 'bg-surface-2 text-fg'
                  : 'text-fg-muted hover:bg-surface-2/60 hover:text-fg'
              }`}
              aria-pressed={view === 'table'}
            >
              <TableIcon className="size-3.5" aria-hidden />
              Table
            </button>
          </div>
        </div>

        {/* Main content */}
        {view === 'calendar' ? (
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
            {!empId && <CheckInOutCard />}
            <div className={!empId ? '' : 'col-span-full'}>
              <AttendanceCalendar
                currentDate={currentDate}
                onPrev={() => navigateMonth(-1)}
                onNext={() => navigateMonth(1)}
                employeeId={empId || undefined}
                onDayClick={handleDayClick}
              />
            </div>
          </div>
        ) : (
          <AttendanceTableView params={attendanceParams} useTeam={showFilters} />
        )}
      </div>

      <RegularizationDialog
        open={regularizationOpen}
        onOpenChange={setRegularizationOpen}
        defaultDate={regularizationDate}
      />

      <DayDetailDrawer
        date={drawerDate}
        record={drawerRecord}
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        onRequestRegularization={handleRequestRegularization}
        readOnly={!!empId}
      />
    </>
  );
}
