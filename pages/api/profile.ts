/**
 * API Route: GET /api/profile
 * Returns profile data as JSON
 */

import type { NextApiRequest, NextApiResponse } from 'next';
import { getProfileData, getProfileMetadata } from '@/lib/profile';
import type { ProfileData } from '@/types/profile';

interface ErrorResponse {
  error: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ProfileData | { metadata: unknown } | ErrorResponse>
): Promise<void> {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    if (req.query.metadata === 'true') {
      const metadata = await getProfileMetadata();
      res.status(200).json({ metadata });
    } else {
      const profileData = await getProfileData();
      res.status(200).json(profileData);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    res.status(500).json({ error: `Failed to load profile data: ${message}` });
  }
}
