import { Request, Response, NextFunction } from 'express';

// Define access rules for each role based on path segments
const ROLE_ACCESS_RULES: Record<string, { blockedPaths: string[]; allowedPaths?: string[] }> = {
  'Investigator': {
    blockedPaths: [] // Full Access
  },
  'Analyst': {
    blockedPaths: ['/chat', '/export-pdf'] // All except Conversational Chat
  },
  'Supervisor': {
    blockedPaths: ['/ocr', '/ner', '/document'] // All except OCR and passbook Document parser
  },
  'Policymaker': {
    blockedPaths: ['/chat', '/export-pdf', '/ocr', '/ner', '/document', '/similarity', '/graph'] // Dashboard metrics only
  }
};

export function verifyRbac(req: Request, res: Response, next: NextFunction) {
  // Extract user role and badge number headers sent by the client SDK adapter
  const userRole = (req.headers['x-user-role'] as string || '').trim();
  const badgeNumber = (req.headers['x-badge-number'] as string || '').trim();

  // If no badge or role is supplied, we still allow requests but treat them as guest or investigator (default fallback to prevent breaking basic local runs, or enforce RBAC strictly)
  // Let's print a warning but enforce it if a role is provided, or check if the headers exist.
  if (!userRole || !badgeNumber) {
    console.log(`[RBAC Middleware] Request on ${req.path} without badge/role headers. Proceeding as default Investigator.`);
    return next();
  }

  const rules = ROLE_ACCESS_RULES[userRole];
  if (!rules) {
    return res.status(403).json({
      error: `Access Denied: Role "${userRole}" is unrecognized in the security access matrix.`
    });
  }

  // Check if requested path starts with any of the blocked segments
  const path = req.path;
  const isBlocked = rules.blockedPaths.some(blocked => path.startsWith(blocked));

  if (isBlocked) {
    console.warn(`[RBAC Blocked] Badge ${badgeNumber} (${userRole}) attempted unauthorized access to ${path}`);
    return res.status(403).json({
      error: `Access Denied: Your role (${userRole}) does not have permission to access this view.`
    });
  }

  next();
}
