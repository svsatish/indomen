export const requireAuth = (req, res, next) => {
  if (!req.session.userId) {
    return res.status(401).json({ error: 'Authentication required' });
  }
  next();
};

export const requireAdmin = (req, res, next) => {
  if (!req.session.userId || req.session.userRole !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
};

export const requireKiosk = (req, res, next) => {
  if (!req.session.userId || (req.session.userRole !== 'kiosk' && req.session.userRole !== 'admin')) {
    return res.status(403).json({ error: 'Kiosk access required' });
  }
  next();
};

export const requireAdminOrKiosk = (req, res, next) => {
  if (!req.session.userId || !['admin', 'kiosk'].includes(req.session.userRole)) {
    return res.status(403).json({ error: 'Admin or Kiosk access required' });
  }
  next();
};
