/** Shape returned by GET /holidays */
export interface Holiday {
  id: string;
  name: string;
  /** ISO string from the server — parse with parseISO; write YYYY-MM-DD via formatDateForApi */
  holidayDate: string;
  location: string | null;
  isOptional: boolean;
  createdAt: string;
  updatedAt: string;
}

/** GET /holidays → data: { holidays: [...], total: N } */
export interface HolidaysData {
  holidays: Holiday[];
  total: number;
}

/** POST /holidays body — holidayDate MUST be YYYY-MM-DD */
export interface HolidayCreateInput {
  name: string;
  holidayDate: string;
  isOptional: boolean;
  location?: string;
}

export type HolidayUpdateInput = Partial<HolidayCreateInput>;

export interface HolidayDeleteResult {
  id: string;
  status: 'deleted';
}

// ── .ics import flow (MSW — backend not yet built) ───────────────────────────

/** POST /holidays/import → 202 */
export interface IcsImportJob {
  jobId: string;
  previewUrl: string;
}

export interface IcsImportCandidate {
  name: string;
  /** YYYY-MM-DD */
  date: string;
  isOptional: boolean;
  willOverwrite: boolean;
}

/** GET /holidays/import/:jobId/preview */
export interface IcsImportPreview {
  candidates: IcsImportCandidate[];
  summary: { new: number; overwrites: number; skipped: number };
}

/** POST /holidays/import/:jobId/commit */
export interface IcsImportCommitResult {
  imported: number;
  overwritten: number;
  skipped: number;
}
