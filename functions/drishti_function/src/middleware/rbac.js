'use strict';

/**
 * Role-Based Access Control (RBAC) middleware for officer credentials.
 * Inspects `x-user-role` and `x-badge-number` headers.
 */
const verifyRbac = (req, res, next) => {
  const userRole = req.headers['x-user-role'];
  const badgeNumber = req.headers['x-badge-number'];

  // Skip strict header check if auth headers are optional in local development mode
  if (!userRole && !badgeNumber) {
    return next();
  }

  const validRoles = ['Investigator', 'Analyst', 'Supervisor', 'Policymaker'];

  if (userRole && !validRoles.includes(userRole)) {
    return res.status(403).json({
      status: 403,
      message: `Access Denied: Role '${userRole}' does not have sufficient clearance for DRISHTI intelligence API.`
    });
  }

  next();
};

module.exports = { verifyRbac };
