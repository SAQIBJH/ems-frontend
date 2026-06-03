'use client';

import { useState } from 'react';
import {
  DownloadIcon,
  PlusIcon,
  BoxIcon,
  LaptopIcon,
  CheckIcon,
  AlertCircleIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatsCard } from '@/components/data-display/StatsCard';
import { PageHeader } from '@/shared/layouts/PageHeader';

import { useAssetsSummary, useAssets } from '../hooks/useAssets';
import { InventoryTab } from './InventoryTab';
import { AssignedTab } from './AssignedTab';
import { RequestsTab } from './RequestsTab';
import { AddAssetDialog } from './AddAssetDialog';

export function AssetsScreen() {
  const [addOpen, setAddOpen] = useState(false);
  const summaryQuery = useAssetsSummary();
  const assetsQuery = useAssets();
  const summary = summaryQuery.data;

  function handleExport() {
    const assets = assetsQuery.data?.assets ?? [];
    if (!assets.length) {
      toast.error('No asset data to export');
      return;
    }
    const rows = [
      ['Tag', 'Name', 'Type', 'Status', 'Assigned To', 'Since'],
      ...assets.map((a) => [
        a.tag,
        a.name,
        a.type,
        a.status,
        a.assignedTo?.name ?? '—',
        a.assignedSince ?? '—',
      ]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'assets-inventory.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Inventory exported');
  }

  return (
    <>
      <PageHeader
        title="Assets"
        description="Track company hardware — what's assigned, available, and in for repair."
        breadcrumbs={[{ label: 'Assets' }]}
        actions={
          <>
            <Button variant="outline" size="sm" onClick={handleExport}>
              <DownloadIcon className="size-3.5" aria-hidden />
              Export
            </Button>
            <Button size="sm" onClick={() => setAddOpen(true)}>
              <PlusIcon className="size-3.5" aria-hidden />
              Add Asset
            </Button>
          </>
        }
      />

      <div className="flex flex-col gap-5 p-6">
        {/* Stats cards */}
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatsCard
            label="Total assets"
            value={summaryQuery.isLoading ? '—' : (summary?.totalAssets ?? 0).toString()}
            icon={<BoxIcon className="size-4" aria-hidden />}
            accent="var(--brand-500)"
            subLine={summary ? { text: 'across 4 sites', tone: 'neutral' } : undefined}
            loading={summaryQuery.isLoading}
          />
          <StatsCard
            label="Assigned"
            value={summaryQuery.isLoading ? '—' : (summary?.assigned ?? 0).toString()}
            icon={<LaptopIcon className="size-4" aria-hidden />}
            accent="var(--dept-engineering)"
            subLine={
              summary
                ? { text: `${summary.utilizationPct}% utilization`, tone: 'neutral' }
                : undefined
            }
            loading={summaryQuery.isLoading}
          />
          <StatsCard
            label="Available"
            value={summaryQuery.isLoading ? '—' : (summary?.available ?? 0).toString()}
            icon={<CheckIcon className="size-4" aria-hidden />}
            accent="var(--success-500)"
            subLine={summary ? { text: 'ready to deploy', tone: 'positive' } : undefined}
            loading={summaryQuery.isLoading}
          />
          <StatsCard
            label="In repair"
            value={summaryQuery.isLoading ? '—' : (summary?.inRepair ?? 0).toString()}
            icon={<AlertCircleIcon className="size-4" aria-hidden />}
            accent="var(--warning-500)"
            subLine={
              summary
                ? { text: `avg ${summary.avgRepairDays}d turnaround`, tone: 'warning' }
                : undefined
            }
            loading={summaryQuery.isLoading}
          />
        </div>

        {/* Tabs */}
        <Tabs defaultValue="inventory">
          <TabsList variant="line" className="mb-2 w-full justify-start">
            <TabsTrigger value="inventory">Inventory</TabsTrigger>
            <TabsTrigger value="assigned">Assigned</TabsTrigger>
            <TabsTrigger value="requests">Requests</TabsTrigger>
          </TabsList>

          <TabsContent value="inventory" className="mt-4">
            <InventoryTab />
          </TabsContent>

          <TabsContent value="assigned" className="mt-4">
            <AssignedTab />
          </TabsContent>

          <TabsContent value="requests" className="mt-4">
            <RequestsTab />
          </TabsContent>
        </Tabs>
      </div>

      <AddAssetDialog open={addOpen} onOpenChange={setAddOpen} />
    </>
  );
}
