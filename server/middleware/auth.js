const jwt = require('jsonwebtoken');
module.exports = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Missing or invalid token' });
    }
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = {
      id: decoded.userId,  
      userId: decoded.userId 
    };
    next();
  } catch (error) {
    console.error('Authentication error:', error.message);
    const status = error.name === 'TokenExpiredError' ? 401 : 403;
    const message = error.expiredAt 
      ? 'Expired token' 
      : 'Invalid token';
    res.status(status).json({ 
      error: `Authentication failed: ${message}` 
    });
  }
};