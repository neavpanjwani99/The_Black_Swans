import { asyncHandler } from '../utils/asyncHandler';
import { ApiError } from '../utils/ApiError';
import { ApiResponse } from '../utils/ApiResponse';

// KSP Authorized credentials
const CREDENTIALS: Record<string, { name: string; role: string; station: string }> = {
  'KSP-7482': { name: 'Inspector Verma', role: 'Investigator', station: 'Banaswadi PS' },
  'KSP-9921': { name: 'Analyst Priya', role: 'Analyst', station: 'HQ Crime Intelligence Section' },
  'KSP-1042': { name: 'ACP Gowda', role: 'Supervisor', station: 'East Division Bengaluru' },
  'KSP-2030': { name: 'SCRB Director Rao', role: 'Policymaker', station: 'State Crime Records Bureau' }
};

export const authController = {
  /**
   * Log in KSP Officer
   */
  login: asyncHandler(async (req, res) => {
    const { badgeNumber, accessPin } = req.body;

    if (!badgeNumber || !accessPin) {
      throw new ApiError(400, 'Badge number and access PIN are required.');
    }

    const trimmedBadge = String(badgeNumber).trim();
    const matchedUser = CREDENTIALS[trimmedBadge];

    if (matchedUser && accessPin === 'password') {
      return res.status(200).json(
        new ApiResponse(200, {
          user: {
            name: matchedUser.name,
            badgeNumber: trimmedBadge,
            role: matchedUser.role,
            station: matchedUser.station
          }
        }, "Login successful")
      );
    }

    throw new ApiError(401, 'Invalid Badge Number or Access PIN. Use credentials such as KSP-7482 with PIN "password".');
  })
};
