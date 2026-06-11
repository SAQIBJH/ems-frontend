'use client';

import { useState } from 'react';
import { PlusIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { findDepartmentPath, type Department } from '@/modules/departments';

/**
 * Turn the selected department id into the chain of FILLED select levels along its
 * path (root → leaf). No trailing empty level — drilling deeper is opt-in via the
 * "Add sub department" button. Seeding `value` with an employee's leaf department
 * renders the whole saved chain (used by both create and edit).
 */
export function buildDepartmentLevels(
  tree: Department[],
  selectedId: string,
): { options: Department[]; value: string }[] {
  const path = selectedId ? findDepartmentPath(tree, selectedId) : [];
  if (path.length === 0) return [{ options: tree, value: '' }];
  const levels: { options: Department[]; value: string }[] = [];
  let options = tree;
  for (const node of path) {
    levels.push({ options, value: node.id });
    options = node.children;
  }
  return levels;
}

/** Red remove/cancel control — standard Button primitive (CLAUDE.md §13). */
function RemoveButton({ onClick, label }: { onClick: () => void; label: string }) {
  return (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="size-8 shrink-0 text-danger hover:bg-danger/10 hover:text-danger"
      aria-label={label}
      onClick={onClick}
    >
      <X className="size-3.5" aria-hidden />
    </Button>
  );
}

/**
 * Renders the Department select (root), then the selected path as filled selects.
 * When the deepest selected department has sub-departments, an "Add sub department"
 * button appears; clicking it reveals the next select. Recursive at any depth.
 * Selecting any level sets the value to that node (most specific wins); the red ✕
 * removes a sub-level (reassigning to its parent).
 */
export function DepartmentCascade({
  tree,
  value,
  onChange,
  invalid,
}: {
  tree: Department[];
  value: string;
  onChange: (id: string) => void;
  invalid: boolean;
}) {
  // Which selected value the (empty) "add sub-department" select is open for. Derived
  // against `value` so it auto-collapses whenever the selection changes.
  const [addingForValue, setAddingForValue] = useState<string | null>(null);

  const levels = buildDepartmentLevels(tree, value);
  const lastLevel = levels[levels.length - 1];
  const selectedNode = lastLevel.options.find((d) => d.id === lastLevel.value);
  const subOptions = selectedNode?.children ?? [];
  const showSub = subOptions.length > 0;
  const addingSub = showSub && value !== '' && addingForValue === value;

  return (
    <div className="space-y-2">
      {levels.map((level, i) => {
        const placeholder = i === 0 ? 'Select department' : 'Select sub-department';
        const removable = i > 0 && level.value !== '';
        return (
          <div key={i} className="flex items-center gap-2">
            <div className="flex-1">
              <Select value={level.value} onValueChange={(v) => onChange(v ?? '')}>
                <SelectTrigger
                  id={i === 0 ? 'df-departmentId' : undefined}
                  className="w-full"
                  aria-invalid={i === 0 ? invalid : undefined}
                >
                  <SelectValue placeholder={placeholder}>
                    {(v) => level.options.find((d) => d.id === v)?.name ?? placeholder}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {level.options.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {removable && (
              <RemoveButton
                onClick={() => onChange(levels[i - 1].value)}
                label="Remove sub-department"
              />
            )}
          </div>
        );
      })}

      {showSub &&
        (addingSub ? (
          <div className="flex items-center gap-2">
            <div className="flex-1">
              <Select value="" onValueChange={(v) => onChange(v ?? '')}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select sub-department">
                    {(v) => subOptions.find((d) => d.id === v)?.name ?? 'Select sub-department'}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {subOptions.map((d) => (
                    <SelectItem key={d.id} value={d.id}>
                      {d.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <RemoveButton onClick={() => setAddingForValue(null)} label="Cancel sub-department" />
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setAddingForValue(value)}
          >
            <PlusIcon className="mr-1.5 size-3.5" aria-hidden />
            Add sub department
          </Button>
        ))}
    </div>
  );
}
