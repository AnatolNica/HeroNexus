const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * @swagger
 * tags:
 *   name: Friends
 *   description: Endpoints for managing friend requests and friendships
 */

/**
 * @swagger
 * /friends/request:
 *   post:
 *     summary: Send a friend request to another user
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user to send the request to
 *     responses:
 *       200:
 *         description: Friend request sent successfully
 *       400:
 *         description: Bad request or duplicate request
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/request', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID format' });
    }

    const sender = await User.findById(req.user.userId);
    const receiver = await User.findById(userId);

    if (!receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (sender._id.equals(receiver._id)) {
      return res.status(400).json({ error: 'Cannot send request to yourself' });
    }

    if (sender.friendRequestsSent.some(id => id.equals(receiver._id))) {
      return res.status(400).json({ error: 'Request already sent' });
    }

    if (receiver.friendRequestsReceived.some(id => id.equals(sender._id))) {
      return res.status(400).json({ error: 'This user has already sent you a request' });
    }

    sender.friendRequestsSent.push(receiver._id);
    receiver.friendRequestsReceived.push(sender._id);

    await Promise.all([sender.save(), receiver.save()]);

    res.json({
      message: 'Friend request sent',
      receiver: {
        _id: receiver._id,
        name: receiver.name
      }
    });

  } catch (error) {
    console.error('Friend request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /friends/accept:
 *   put:
 *     summary: Accept a received friend request
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user whose request is being accepted
 *     responses:
 *       200:
 *         description: Friend request accepted
 *       400:
 *         description: No pending request or invalid data
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/accept', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await User.findById(req.user.userId);
    const requester = await User.findById(userId);

    if (!requester) {
      return res.status(404).json({ error: 'User not found' });
    }

    const requestIndex = user.friendRequestsReceived.findIndex(id => id.equals(requester._id));
    if (requestIndex === -1) {
      return res.status(400).json({ error: 'No pending request' });
    }

    user.friends.push(requester._id);
    requester.friends.push(user._id);

    user.friendRequestsReceived.splice(requestIndex, 1);
    requester.friendRequestsSent = requester.friendRequestsSent.filter(id => !id.equals(user._id));

    await Promise.all([user.save(), requester.save()]);

    res.json({
      message: 'Friend request accepted',
      friend: {
        _id: requester._id,
        name: requester.name
      }
    });

  } catch (error) {
    console.error('Accept request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /friends/decline:
 *   put:
 *     summary: Decline a received friend request
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - userId
 *             properties:
 *               userId:
 *                 type: string
 *                 description: ID of the user whose request is being declined
 *     responses:
 *       200:
 *         description: Friend request declined
 *       400:
 *         description: No pending request or invalid data
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.put('/decline', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.body;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await User.findById(req.user.userId);
    const requester = await User.findById(userId);

    if (!requester) {
      return res.status(404).json({ error: 'User not found' });
    }

    const requestIndex = user.friendRequestsReceived.findIndex(id => id.equals(requester._id));
    if (requestIndex === -1) {
      return res.status(400).json({ error: 'No pending request' });
    }

    user.friendRequestsReceived.splice(requestIndex, 1);
    requester.friendRequestsSent = requester.friendRequestsSent.filter(id => !id.equals(user._id));

    await Promise.all([user.save(), requester.save()]);

    res.json({ message: 'Friend request declined' });

  } catch (error) {
    console.error('Decline request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /friends/request/{userId}:
 *   delete:
 *     summary: Cancel a sent friend request
 *     tags: [Friends]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user to cancel the request for
 *     responses:
 *       200:
 *         description: Friend request canceled
 *       400:
 *         description: No sent request found or invalid ID
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.delete('/request/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const sender = await User.findById(req.user.userId);
    const receiver = await User.findById(userId);

    if (!receiver) {
      return res.status(404).json({ error: 'User not found' });
    }

    const sentIndex = sender.friendRequestsSent.findIndex(id => id.equals(receiver._id));
    if (sentIndex === -1) {
      return res.status(400).json({ error: 'No sent request found' });
    }

    sender.friendRequestsSent.splice(sentIndex, 1);
    receiver.friendRequestsReceived = receiver.friendRequestsReceived.filter(id => !id.equals(sender._id));

    await Promise.all([sender.save(), receiver.save()]);

    res.json({ message: 'Friend request canceled' });

  } catch (error) {
    console.error('Cancel request error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
