export type ReviewStatus = 'Not started' | 'Self review' | 'Manager review' | 'Calibrated';

export type RatingValue = 'Exceeds' | 'Strong' | 'Meets' | 'Developing' | 'Below';

export type GoalStatus = 'On track' | 'At risk' | 'Done';

export type CycleStatus = 'Upcoming' | 'In progress' | 'Calibrating' | 'Closed';

export type NoteTone = 'warning' | 'success' | 'danger' | 'info';

export interface ActiveCycle {
  id: string;
  name: string;
  selfReviewDue: string;
  managerReviewDue: string;
  calibrationDate: string;
  progressPct: number;
  status: CycleStatus;
  startedAt: string;
}

export interface PerformanceSummary {
  reviewsComplete: number;
  reviewsTotal: number;
  goalsOnTrackPct: number;
  goalsOnTrackDelta: number;
  avgRating: number;
  overdueReviews: number;
}

export interface Review {
  employeeId: string;
  employeeName: string;
  department: string;
  reviewerName: string;
  status: ReviewStatus;
  rating: RatingValue | null;
  selfComplete: boolean;
  managerComplete: boolean;
}

export interface ReviewsPage {
  reviews: Review[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Goal {
  id: string;
  employeeId: string;
  employeeName: string;
  title: string;
  progressPct: number;
  dueDate: string;
  status: GoalStatus;
}

export interface GoalsPage {
  goals: Goal[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface CalibrationNote {
  tone: NoteTone;
  title: string;
  body: string;
}

export interface RatingBand {
  rating: RatingValue;
  count: number;
  pct: number;
}

export interface CalibrationData {
  totalReviewed: number;
  distribution: RatingBand[];
  notes: CalibrationNote[];
}

export interface AddGoalInput {
  employeeId: string;
  title: string;
  dueDate: string;
  progressPct: number;
}

export interface ReviewsParams {
  departmentId?: string;
  status?: ReviewStatus;
  page?: number;
  limit?: number;
}

export interface GoalsParams {
  status?: GoalStatus;
  page?: number;
  limit?: number;
}
