import { apiClient } from '@/lib/api-client';
import type {
  RecruitmentSummary,
  OpeningsPage,
  CandidatesPage,
  AdvanceCandidateResult,
  PostJobInput,
  Opening,
  OpeningsParams,
  CandidatesParams,
  RecruitersResponse,
  UpdateRatingResult,
  UpdateOpeningInput,
} from '../types/recruitment.types';

export const recruitmentApi = {
  getSummary: async (): Promise<RecruitmentSummary> => {
    const { data } = await apiClient.get<{ data: RecruitmentSummary }>('/recruitment/summary');
    return data.data;
  },

  getOpenings: async (params?: OpeningsParams): Promise<OpeningsPage> => {
    const { data } = await apiClient.get<{ data: OpeningsPage }>('/recruitment/openings', {
      params,
    });
    return data.data;
  },

  getCandidates: async (params?: CandidatesParams): Promise<CandidatesPage> => {
    const { data } = await apiClient.get<{ data: CandidatesPage }>('/recruitment/candidates', {
      params,
    });
    return data.data;
  },

  advanceCandidate: async (id: string, stage: string): Promise<AdvanceCandidateResult> => {
    const { data } = await apiClient.post<{ data: AdvanceCandidateResult }>(
      `/recruitment/candidates/${id}/advance`,
      { stage },
    );
    return data.data;
  },

  postJob: async (input: PostJobInput): Promise<Opening> => {
    const { data } = await apiClient.post<{ data: Opening }>('/recruitment/openings', input);
    return data.data;
  },

  getRecruiters: async (): Promise<RecruitersResponse> => {
    const { data } = await apiClient.get<{ data: RecruitersResponse }>('/recruitment/recruiters');
    return data.data;
  },

  updateOpening: async (id: string, input: UpdateOpeningInput): Promise<Opening> => {
    const { data } = await apiClient.patch<{ data: Opening }>(`/recruitment/openings/${id}`, input);
    return data.data;
  },

  updateRating: async (id: string, rating: number): Promise<UpdateRatingResult> => {
    const { data } = await apiClient.patch<{ data: UpdateRatingResult }>(
      `/recruitment/candidates/${id}/rating`,
      { rating },
    );
    return data.data;
  },
};
