/**
 * EmployeesScreen — replicates src/app/(dashboard)/employees + EmployeeTable.
 * Toolbar (search + filters), DataTable, pagination.
 */

const EMPLOYEE_DATA = [
  { code: 'EMP-04217', name: 'Aman Khanna',     dept: 'Engineering', role: 'Senior Engineer',   type: 'FULL_TIME', status: 'Active', joined: '2022-04-12', email: 'aman@acme.test' },
  { code: 'EMP-04231', name: 'Priya Sharma',    dept: 'People Ops',  role: 'HR Manager',        type: 'FULL_TIME', status: 'Active', joined: '2021-08-03', email: 'priya@acme.test' },
  { code: 'EMP-04244', name: 'Rohan Mehta',     dept: 'Sales',       role: 'Account Executive', type: 'FULL_TIME', status: 'On leave', joined: '2023-01-19', email: 'rohan@acme.test' },
  { code: 'EMP-04258', name: 'Nisha Iyer',      dept: 'Product',     role: 'Product Designer',  type: 'FULL_TIME', status: 'Active', joined: '2024-11-04', email: 'nisha@acme.test' },
  { code: 'EMP-04261', name: 'Vikram Singh',    dept: 'Engineering', role: 'Engineering Lead',  type: 'FULL_TIME', status: 'Active', joined: '2020-02-17', email: 'vikram@acme.test' },
  { code: 'EMP-04279', name: 'Asha Joshi',      dept: 'Finance',     role: 'Financial Analyst', type: 'FULL_TIME', status: 'Active', joined: '2022-09-12', email: 'asha@acme.test' },
  { code: 'EMP-04283', name: 'Karan Mehra',     dept: 'Sales',       role: 'SDR',               type: 'CONTRACT',  status: 'Active', joined: '2025-03-01', email: 'karan@acme.test' },
  { code: 'EMP-04292', name: 'Sneha Rao',       dept: 'Operations',  role: 'Ops Manager',       type: 'FULL_TIME', status: 'Active', joined: '2019-07-15', email: 'sneha@acme.test' },
  { code: 'EMP-04304', name: 'Devansh Patel',   dept: 'Engineering', role: 'Junior Engineer',   type: 'INTERNSHIP',status: 'Active', joined: '2026-02-01', email: 'devansh@acme.test' },
  { code: 'EMP-04311', name: 'Maya Rangan',     dept: 'Legal',       role: 'Counsel',           type: 'PART_TIME', status: 'Active', joined: '2023-06-08', email: 'maya@acme.test' },
];

const STATUS_BADGE = {
  'Active':   { variant: 'success', dot: true },
  'On leave': { variant: 'warning', dot: true },
  'Terminated': { variant: 'danger', dot: false },
};

function EmployeesScreen({ onOpenEmployee }) {
  const { Button, Badge, Avatar, Input, SelectTrigger, Checkbox } = window.UI;
  const I = window.Icons;
  const [selected, setSelected] = React.useState(new Set());
  const [search, setSearch] = React.useState('');

  const visible = EMPLOYEE_DATA.filter((e) =>
    !search || e.name.toLowerCase().includes(search.toLowerCase()) || e.code.toLowerCase().includes(search.toLowerCase())
  );
  const allSelected = visible.length > 0 && visible.every((e) => selected.has(e.code));

  function toggle(code) {
    const next = new Set(selected);
    next.has(code) ? next.delete(code) : next.add(code);
    setSelected(next);
  }
  function toggleAll() {
    if (allSelected) setSelected(new Set());
    else setSelected(new Set(visible.map((e) => e.code)));
  }

  return (
    <>
      <window.PageHeader
        title="Employees"
        description="Manage your organization's employee directory."
        breadcrumbs={[{ label: 'Employees' }]}
        actions={<Button icon={<I.Plus />}>Add Employee</Button>}
      />

      <div className="ems-page">
        {/* Toolbar */}
        <div className="toolbar">
          <div style={{ position: 'relative', width: 280 }}>
            <I.Search size={14} style={{ position: 'absolute', top: 9, left: 10, color: 'var(--text-tertiary)' }} />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name or code…"
              style={{ paddingLeft: 32 }}
            />
          </div>
          <SelectTrigger placeholder="All departments" style={{ width: 180 }} />
          <SelectTrigger placeholder="All statuses" style={{ width: 160 }} />
          <SelectTrigger placeholder="All types" style={{ width: 140 }} />
          <div style={{ flex: 1 }} />
          {selected.size > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ font: '500 13px/18px var(--font-sans)', color: 'var(--text-secondary)' }}>
                {selected.size} selected
              </span>
              <Button variant="outline" size="sm">Bulk edit</Button>
              <Button variant="destructive" size="sm">Delete</Button>
            </div>
          )}
          <Button variant="outline" size="sm" icon={<I.Filter />}>Save view</Button>
        </div>

        {/* Table */}
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th style={{ width: 40 }}><Checkbox checked={allSelected} onChange={toggleAll} /></th>
                <th style={{ width: 110 }}>Code</th>
                <th>Employee</th>
                <th>Department</th>
                <th>Type</th>
                <th>Status</th>
                <th>Joined <I.ArrowUpDown size={12} style={{ display: 'inline', verticalAlign: -2, color: 'var(--text-tertiary)' }} /></th>
                <th style={{ width: 40 }}></th>
              </tr>
            </thead>
            <tbody>
              {visible.map((e) => {
                const statusCfg = STATUS_BADGE[e.status] || { variant: 'secondary' };
                return (
                  <tr key={e.code} onClick={() => onOpenEmployee?.(e)} style={{ cursor: 'pointer' }}>
                    <td onClick={(ev) => ev.stopPropagation()}>
                      <Checkbox checked={selected.has(e.code)} onChange={() => toggle(e.code)} />
                    </td>
                    <td className="mono">{e.code}</td>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <Avatar size="sm" name={e.name} />
                        <div style={{ minWidth: 0 }}>
                          <div style={{ font: '500 13px/18px var(--font-sans)', color: 'var(--text-primary)' }}>{e.name}</div>
                          <div style={{ font: '400 12px/16px var(--font-sans)', color: 'var(--text-tertiary)' }}>{e.role}</div>
                        </div>
                      </div>
                    </td>
                    <td>{e.dept}</td>
                    <td><Badge variant="outline">{e.type}</Badge></td>
                    <td><Badge variant={statusCfg.variant} dot={statusCfg.dot}>{e.status}</Badge></td>
                    <td className="num" style={{ color: 'var(--text-secondary)' }}>{e.joined}</td>
                    <td onClick={(ev) => ev.stopPropagation()}>
                      <button className="btn btn-ghost btn-icon-xs" aria-label="Row actions">
                        <I.MoreHorizontal size={14} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ padding: '12px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border-subtle)', background: 'var(--bg-surface)' }}>
            <span style={{ font: '400 13px/18px var(--font-sans)', color: 'var(--text-secondary)' }}>
              Showing <strong style={{ color: 'var(--text-primary)' }}>1–{visible.length}</strong> of <strong style={{ color: 'var(--text-primary)' }}>1,240</strong>
            </span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Button variant="outline" size="sm" icon={<I.ChevronLeft />} disabled>Prev</Button>
              <span style={{ font: '500 13px/18px var(--font-sans)', color: 'var(--text-secondary)', padding: '0 8px' }}>Page 1 of 124</span>
              <Button variant="outline" size="sm">Next<I.ChevronRight /></Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

window.EmployeesScreen = EmployeesScreen;
