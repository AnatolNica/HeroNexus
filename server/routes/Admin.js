const express = require('express');
const router = express.Router();
const User = require('../models/User');
const jwt = require('jsonwebtoken');
/**
 * @swagger
 * tags:
 *   name: AdminUsers
 *   description: Admin operations for user management
 */
const adminMiddleware = async (req, res, next) => {
    try {
      const token = req.headers.authorization?.split(' ')[1];
      if (!token) return res.status(401).json({ error: 'Unauthorized' });
      
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.userId);
      
      if (!user || user.role !== 'admin') {
        return res.status(403).json({ error: 'Access forbidden' });
      }
  
      next();
    } catch (error) {
      console.error('Admin middleware error:', error);
      res.status(500).json({ error: 'Server error' });
    }
  };

  /**
 * @swagger
 * /users:
 *   get:
 *     summary: Get paginated list of users (admin only)
 *     tags: [AdminUsers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 30
 *         description: Number of users per page
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *         description: Search term for name or email
 *     responses:
 *       200:
 *         description: List of users with pagination info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       email:
 *                         type: string
 *                       avatar:
 *                         type: string
 *                       billingAddress:
 *                         type: object
 *                         nullable: true
 *                       blockUntil:
 *                         type: string
 *                         format: date-time
 *                         nullable: true
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     totalUsers:
 *                       type: integer
 *       401:
 *         description: Unauthorized - no token provided
 *       403:
 *         description: Forbidden - user is not admin
 *       500:
 *         description: Server error
 */
  router.get('/users', adminMiddleware, async (req, res) => {
    try {
      const page = parseInt(req.query.page) || 1;
      const limit = parseInt(req.query.limit) || 30;
      const search = req.query.search || '';
  
      const query = {};
      if (search) {
        query.$or = [
          { name: { $regex: search, $options: 'i' } },
          { email: { $regex: search, $options: 'i' } }
        ];
      }
  
      const totalUsers = await User.countDocuments(query);
      const totalPages = Math.ceil(totalUsers / limit);
      const skip = (page - 1) * limit;
  
      const users = await User.find(query)
        .select('-password -paymentMethods -transactions -friends -friendRequestsSent -friendRequestsReceived')
        .skip(skip)
        .limit(limit)
        .lean();
  
        const formattedUsers = users.map(user => ({
            ...user,
            avatar: user.avatar ? `${process.env.BASE_URL}${user.avatar}` : '/default-avatar.jpg',
            billingAddress: user.billingAddress || undefined, 
            blockUntil: user.blockUntil || undefined 
          }));
  
      res.json({
        users: formattedUsers,
        pagination: {
          currentPage: page,
          totalPages,
          totalUsers
        }
      });
    } catch (error) {
      console.error('Error retrieving users:', error);
      res.status(500).json({ error: 'Error retrieving users' });
    }
  });
/**
 * @swagger
 * /users/{id}:
 *   put:
 *     summary: Update a user by ID (admin only)
 *     tags: [AdminUsers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to update
 *     requestBody:
 *       description: Fields to update
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *               country:
 *                 type: string
 *               language:
 *                 type: string
 *               currency:
 *                 type: string
 *               phoneNumber:
 *                 type: string
 *               password:
 *                 type: string
 *             example:
 *               role: user
 *               country: US
 *               language: en
 *               currency: USD
 *               phoneNumber: "+1 555 123 4567"
 *               password: "newpassword123"
 *     responses:
 *       200:
 *         description: Updated user object
 *       400:
 *         description: Invalid input or update failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Server error
 */
  router.put('/users/:id', adminMiddleware, async (req, res) => {
    try {
      const { id } = req.params;
      const updates = req.body;
  
      const allowedCountries = ['MD', 'US', 'RO'];
      const allowedLanguages = ['en', 'ro', 'ru'];
      const allowedCurrencies = ['USD', 'EUR', 'MDL'];
  
      if (updates.role && !['user', 'admin'].includes(updates.role)) {
        return res.status(400).json({ error: 'Invalid role' });
      }
      if (updates.country && !allowedCountries.includes(updates.country)) {
        return res.status(400).json({ error: 'Invalid country' });
      }
      if (updates.language && !allowedLanguages.includes(updates.language)) {
        return res.status(400).json({ error: 'Invalid language' });
      }
      if (updates.currency && !allowedCurrencies.includes(updates.currency)) {
        return res.status(400).json({ error: 'Invalid currency' });
      }
      if (updates.phoneNumber && !/^\+?[0-9\s\-()]{7,}$/.test(updates.phoneNumber)) {
        return res.status(400).json({ 
          error: 'Invalid phone number. Accepted format: +40 722 123 456 or 0722-123-456' 
        });
      }
      if (updates.password && updates.password.length < 6) {
        return res.status(400).json({ error: 'The password must be at least 6 characters long' });
      }
  
      const updatedUser = await User.findByIdAndUpdate(id, updates, { new: true });
      res.json(updatedUser);
    } catch (error) {
      console.error('Update error', error);
      res.status(400).json({ error: 'Update failed' });
    }
  });
/**
 * @swagger
 * /users/{id}:
 *   delete:
 *     summary: Delete a user by ID (admin only)
 *     tags: [AdminUsers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to delete
 *     responses:
 *       200:
 *         description: Success message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         description: Deletion failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
router.delete('/users/:id', adminMiddleware, async (req, res) => {
  try {
    await User.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(400).json({ error: 'Deletion failed' });
  }
});

/**
 * @swagger
 * /users/{id}/reset-password:
 *   put:
 *     summary: Reset a user's password (admin only)
 *     tags: [AdminUsers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to reset password for
 *     requestBody:
 *       description: New password
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               newPassword:
 *                 type: string
 *                 minLength: 6
 *             example:
 *               newPassword: "newStrongPass123"
 *     responses:
 *       200:
 *         description: Password reset success
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *       400:
 *         description: Invalid password or reset failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       404:
 *         description: User not found
 */
router.put('/users/:id/reset-password', adminMiddleware, async (req, res) => {
    try {
      const user = await User.findById(req.params.id);
      if (!user) return res.status(404).json({ error: 'User not found' });
  
      if (!req.body.newPassword || req.body.newPassword.length < 6) {
        return res.status(400).json({ error: 'The password must be at least 6 characters long' });
      }
  
      user.password = req.body.newPassword;
      await user.save();
      
      res.json({ success: true });
    } catch (error) {
      res.status(400).json({ error: 'Password reset failed' });
    }
  });
/**
 * @swagger
 * /users/{id}/block:
 *   put:
 *     summary: Block or unblock a user until a specified date (admin only)
 *     tags: [AdminUsers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: User ID to block/unblock
 *     requestBody:
 *       description: BlockUntil date or empty to unblock
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               blockUntil:
 *                 type: string
 *                 format: date-time
 *                 nullable: true
 *             example:
 *               blockUntil: "2025-12-31T23:59:59Z"
 *     responses:
 *       200:
 *         description: Updated user data with blockUntil info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 blockUntil:
 *                   type: string
 *                   format: date-time
 *                   nullable: true
 *       400:
 *         description: Operation failed
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 */
  router.put('/users/:id/block', adminMiddleware, async (req, res) => {
    try {
      const update = req.body.blockUntil 
        ? { blockUntil: new Date(req.body.blockUntil) }
        : { $unset: { blockUntil: 1 } };
  
      const user = await User.findByIdAndUpdate(
        req.params.id,
        update,
        { new: true }
      ).lean();
  
      if (user.blockUntil) {
        user.blockUntil = new Date(user.blockUntil).toISOString();
      }
  
      res.json({
        ...user,
        blockUntil: user.blockUntil ? new Date(user.blockUntil) : undefined
      });
    } catch (error) {
      res.status(400).json({ error: 'Operation failed' });
    }
  });
module.exports = router;