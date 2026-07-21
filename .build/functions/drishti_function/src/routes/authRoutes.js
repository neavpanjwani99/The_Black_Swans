'use strict';

const express = require('express');
const authRouter = express.Router();

const KSP_CREDENTIALS = {
  'KSP-7482': { name: 'Inspector Verma', role: 'Investigator', station: 'Banaswadi PS' },
  'KSP-9921': { name: 'Analyst Priya', role: 'Analyst', station: 'HQ Crime Intelligence Section' },
  'KSP-1042': { name: 'ACP Gowda', role: 'Supervisor', station: 'East Division Bengaluru' },
  'KSP-2030': { name: 'SCRB Director Rao', role: 'Policymaker', station: 'State Crime Records Bureau' }
};

authRouter.post('/login', (req, res) => {
  const { badgeNumber, accessPin } = req.body || {};

  if (!badgeNumber || !accessPin) {
    return res.status(400).json({
      status: 'fail',
      message: 'Badge Number and Access PIN are required.'
    });
  }

  const cleanBadge = String(badgeNumber).trim();
  const matchedUser = KSP_CREDENTIALS[cleanBadge];

  if (matchedUser && accessPin === 'password') {
    return res.status(200).json({
      status: 'success',
      data: {
        user: {
          name: matchedUser.name,
          badgeNumber: cleanBadge,
          role: matchedUser.role,
          station: matchedUser.station
        }
      },
      message: 'Officer authenticated successfully.'
    });
  }

  return res.status(401).json({
    status: 'fail',
    message: 'Invalid Officer Badge Number or Access PIN.'
  });
});

module.exports = { authRouter };
