/**
 * Midwife Link Service
 * 
 * Claim a midwife QR code for a child or pregnancy profile.
 */

import { apiClient } from './apiClient';

export type MidwifeLinkProfileType = 'child' | 'pregnancy';

export interface ClaimMidwifeLinkRequest {
  code: string;
  profileType: MidwifeLinkProfileType;
  profileId: string;
}

export interface ClaimMidwifeLinkResponse {
  success: boolean;
  data: {
    profileType: MidwifeLinkProfileType;
    profileId: string;
    midwife: {
      id: string;
      name?: string | null;
      phone?: string | null;
      facilityName?: string | null;
      region?: string | null;
    };
  };
}

export const midwifeLinkService = {
  async claimMidwifeLink(payload: ClaimMidwifeLinkRequest): Promise<ClaimMidwifeLinkResponse> {
    return apiClient.post<ClaimMidwifeLinkResponse>('/midwife-links/claim', payload);
  },
};
