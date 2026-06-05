import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface PayrollState {
  /** The legal entity that scopes payroll configuration and runs. */
  activeLegalEntityId: string | null;
  setActiveLegalEntity: (id: string | null) => void;
}

export const usePayrollStore = create<PayrollState>()(
  persist(
    (set) => ({
      activeLegalEntityId: null,
      setActiveLegalEntity: (id) => set({ activeLegalEntityId: id }),
    }),
    { name: 'ems-payroll-state' },
  ),
);
