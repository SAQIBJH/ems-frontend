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
