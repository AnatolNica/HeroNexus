const jwt = require('jsonwebtoken');
const User = require('../models/User');

const adminMiddleware = async (req, res, next) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.userId);
    
    if (!user || user.role !== 'admin') {
      return res.status(403).json({ error: 'Access denied' });
    }

    req.user = user;
    next();
  } catch (error) {
    res.status(401).json({ error: 'Access denied' });
  }
};

module.exports = adminMiddleware;