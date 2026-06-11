'use client';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { findDepartmentPath, type Department } from '@/modules/departments';

/**
 * Turn the selected department id into a chain of select levels: roots first, then
 * the children of each selected node. The deepest selected node IS `departmentId`;
 * drilling into a sub-department is optional (a parent is a valid choice). Seeding
 * `value` with an employee's leaf department auto-expands the whole chain (and shows
 * an empty sub-department select when the current department has children).
 */
export function buildDepartmentLevels(
  tree: Department[],
  selectedId: string,
): { options: Department[]; value: string }[] {
  const path = findDepartmentPath(tree, selectedId);
  const levels: { options: Department[]; value: string }[] = [];
  let options = tree;
  for (let i = 0; ; i++) {
    const node = path[i];
    levels.push({ options, value: node?.id ?? '' });
    if (!node || node.children.length === 0) break;
    options = node.children;
  }
  return levels;
}

/**
 * Renders the Department select, plus a Sub-department select for each level that has
 * children. Selecting any level sets the value to that node (the most specific pick
 * wins); deeper levels reset automatically because the chain is derived from the value.
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
  const levels = buildDepartmentLevels(tree, value);
  return (
    <div className="space-y-2">
      {levels.map((level, i) => {
        const placeholder = i === 0 ? 'Select department' : 'Select sub-department';
        // Sub-levels with a selection can be removed → reassign to the parent level,
        // dropping this level and anything deeper. The root department is required.
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
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="size-8 shrink-0 text-danger hover:bg-danger/10 hover:text-danger"
                aria-label="Remove sub-department"
                onClick={() => onChange(levels[i - 1].value)}
              >
                <X className="size-3.5" aria-hidden />
              </Button>
            )}
          </div>
        );
      })}
    </div>
  );
}
