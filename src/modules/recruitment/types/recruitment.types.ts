export type RecruitmentStage = 'applied' | 'screening' | 'interview' | 'offer' | 'hired';

export type OpeningStatus = 'Open' | 'Closing' | 'On hold' | 'Closed';

export type EmploymentType = 'FULL_TIME' | 'PART_TIME' | 'CONTRACT' | 'INTERNSHIP';

export interface RecruitmentSummary {
  openRequisitions: number;
  activeCandidates: number;
  interviewsThisWeek: number;
  avgDaysToHire: number;
  closingThisWeek: number;
  interviewsToday: number;
}

export interface Opening {
  id: string;
  title: string;
  department: string;
  location: string;
  employmentType: EmploymentType;
  applicantCount: number;
  currentStage: string;
  status: OpeningStatus;
  createdAt: string;
}

export interface OpeningsPage {
  openings: Opening[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface Candidate {
  id: string;
  name: string;
  role: string;
  openingId: string;
  stage: RecruitmentStage;
  rating: number;
  daysInStage: number;
  isReferral: boolean;
  tag: string;
  email: string;
  appliedAt: string;
}

export interface CandidatesPage {
  candidates: Candidate[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

export interface AdvanceCandidateResult {
  id: string;
  stage: RecruitmentStage;
  daysInStage: number;
}

export interface PostJobInput {
  title: string;
  department: string;
  location: string;
  employmentType: EmploymentType;
}

export interface OpeningsParams {
  page?: number;
  limit?: number;
  status?: OpeningStatus;
}

export interface CandidatesParams {
  openingId?: string;
  stage?: RecruitmentStage;
  page?: number;
  limit?: number;
}

export interface Recruiter {
  id: string;
  name: string;
  email: string;
}

export interface RecruitersResponse {
  recruiters: Recruiter[];
}

export interface UpdateRatingResult {
  id: string;
  rating: number;
}
