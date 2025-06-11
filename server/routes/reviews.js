const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Review = require('../models/Review');
const mongoose = require('mongoose');

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Operations related to figurine reviews
 */

/**
 * @swagger
 * /api/reviews:
 *   post:
 *     summary: Create a new review for a figurine
 *     description: Allows an authenticated user to submit a review for a specific figurine, including rating and optional text.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               figureId:
 *                 type: number
 *                 description: The ID of the figurine being reviewed
 *               stars:
 *                 type: number
 *                 description: Star rating from 1 to 5
 *               text:
 *                 type: string
 *                 description: Optional review text
 *     responses:
 *       201:
 *         description: Review created successfully
 *       500:
 *         description: Internal server error while saving the review
 */
router.post('/', authMiddleware, async (req, res) => {
  try {
    const { figureId, stars, text } = req.body;

    const review = new Review({
      user: req.user.userId,
      figure: figureId,
      stars,
      text
    });

    await review.save();

    const populatedReview = await Review.findById(review._id)
      .populate('user', 'name avatar')
      .lean();

    res.status(201).json({
      ...populatedReview,
      user: {
        ...populatedReview.user,
        avatar: populatedReview.user.avatar ?
          `${process.env.BASE_URL}${populatedReview.user.avatar}` : null
      }
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({ error: 'Error saving review' });
  }
});

/**
 * @swagger
 * /api/reviews/{figureId}:
 *   get:
 *     summary: Get reviews for a specific figurine
 *     description: Fetch all reviews submitted for the figurine identified by the provided ID.
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: figureId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the figurine
 *     responses:
 *       200:
 *         description: List of reviews
 *       500:
 *         description: Internal server error while retrieving reviews
 */
router.get('/:figureId', async (req, res) => {
  try {
    const figureId = parseInt(req.params.figureId);
    const reviews = await Review.find({ figure: figureId })
      .populate({
        path: 'user',
        select: 'name avatar',
        transform: doc => ({
          _id: doc._id,
          name: doc.name,
          avatar: doc.avatar ?
            (doc.avatar.startsWith('http') ?
              doc.avatar :
              `${process.env.BASE_URL}${doc.avatar}`) :
            null
        })
      })
      .sort({ createdAt: -1 })
      .lean();

    if (!reviews || reviews.length === 0) {
      return res.json([]);
    }

    const userIds = [
      ...reviews.map(review => review.user?._id).filter(Boolean),
      ...reviews.flatMap(review => (review.likes || []).filter(id => id)),
      ...reviews.flatMap(review => (review.dislikes || []).filter(id => id)),
      ...reviews.flatMap(review =>
        (review.replies || []).map(reply => reply?.user).filter(Boolean)
      )
    ];

    const uniqueUserIds = [...new Set(userIds)];

    const users = await mongoose.model('User').find(
      { _id: { $in: uniqueUserIds } },
      'name avatar'
    ).lean();

    const userMap = {};
    users.forEach(user => {
      userMap[user._id.toString()] = {
        name: user.name,
        avatar: user.avatar ? `${process.env.BASE_URL}${user.avatar}` : null
      };
    });

    const formattedReviews = reviews.map(review => ({
      ...review,
      date: new Date(review.createdAt).toLocaleDateString('ro-RO', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      }),
      likes: (review.likes || []).map(userId => {
        const user = userMap[userId?.toString()];
        return user ? { _id: userId, ...user } : null;
      }).filter(Boolean),
      dislikes: (review.dislikes || []).map(userId => {
        const user = userMap[userId?.toString()];
        return user ? { _id: userId, ...user } : null;
      }).filter(Boolean),
      replies: (review.replies || []).map(reply => ({
        ...reply,
        user: {
          _id: reply.user.toString(),
          ...(userMap[reply.user.toString()] || { name: 'Unknown user', avatar: null })
        },
        createdAt: new Date(reply.createdAt).toISOString()
      }))
    }));

    res.json(formattedReviews);
  } catch (error) {
    console.error('Error fetching reviews:', error);
    res.status(500).json({ error: 'Error retrieving reviews' });
  }
});

/**
 * @swagger
 * /api/reviews/{reviewId}/like:
 *   post:
 *     summary: Like a review
 *     description: Allows an authenticated user to like a review. If the user already liked it, the like will be removed (toggle).
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         schema:
 *           type: string
 *         required: true
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review liked/unliked successfully
 *       500:
 *         description: Internal server error while updating like
 */
router.post('/:reviewId/like', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    const userId = req.user.userId;

    if (review.dislikes.includes(userId)) {
      review.dislikes.pull(userId);
    }

    if (review.likes.includes(userId)) {
      review.likes.pull(userId);
    } else {
      review.likes.push(userId);
    }

    await review.save();
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: 'Error updating like' });
  }
});

/**
 * @swagger
 * /api/reviews/{reviewId}/dislike:
 *   post:
 *     summary: Dislike a review
 *     description: Allows an authenticated user to dislike a review. If the user already disliked it, the dislike will be removed (toggle).
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         schema:
 *           type: string
 *         required: true
 *         description: Review ID
 *     responses:
 *       200:
 *         description: Review disliked/undisliked successfully
 *       500:
 *         description: Internal server error while updating dislike
 */
router.post('/:reviewId/dislike', authMiddleware, async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);
    const userId = req.user.userId;

    if (review.likes.includes(userId)) {
      review.likes.pull(userId);
    }

    if (review.dislikes.includes(userId)) {
      review.dislikes.pull(userId);
    } else {
      review.dislikes.push(userId);
    }

    await review.save();
    res.json(review);
  } catch (error) {
    res.status(500).json({ error: 'Error updating dislike' });
  }
});

/**
 * @swagger
 * /api/reviews/{reviewId}/replies:
 *   post:
 *     summary: Add a reply to a review
 *     description: Allows an authenticated user to post a reply/comment under a specific review.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         schema:
 *           type: string
 *         required: true
 *         description: Review ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               text:
 *                 type: string
 *                 description: Reply content
 *     responses:
 *       200:
 *         description: Reply added successfully
 *       500:
 *         description: Internal server error while adding reply
 */
router.post('/:reviewId/replies', authMiddleware, async (req, res) => {
  try {
    const { text } = req.body;
    const review = await Review.findById(req.params.reviewId);

    review.replies.push({
      user: req.user.userId,
      text
    });

    const savedReview = await review.save();

    const populatedReview = await Review.findById(savedReview._id)
      .populate({
        path: 'replies.user',
        select: 'name avatar',
        transform: doc => ({
          _id: doc._id,
          name: doc.name,
          avatar: doc.avatar ? `${process.env.BASE_URL}${doc.avatar}` : null
        })
      })
      .lean();

    res.json(populatedReview.replies);
  } catch (error) {
    res.status(500).json({ error: 'Error adding reply' });
  }
});

/**
 * @swagger
 * /api/reviews/{reviewId}/replies/{replyId}:
 *   delete:
 *     summary: Delete a reply from a review
 *     description: Allows the user who created the reply to delete it.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the review
 *       - in: path
 *         name: replyId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the reply
 *     responses:
 *       200:
 *         description: Reply deleted successfully
 *       403:
 *         description: Access denied (not the reply owner)
 *       404:
 *         description: Review or reply not found
 */
router.delete('/:reviewId/replies/:replyId', authMiddleware, async (req, res) => {
  try {
    const { reviewId, replyId } = req.params;
    const review = await Review.findById(reviewId);
    if (!review) return res.status(404).json({ error: 'Review not found' });

    const replyIndex = review.replies.findIndex(r => r._id?.toString() === replyId);
    if (replyIndex === -1) return res.status(404).json({ error: 'Reply not found' });

    const reply = review.replies[replyIndex];
    if (reply.user.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied - You cannot delete this reply' });
    }

    review.replies.splice(replyIndex, 1);
    await review.save();

    res.json({ success: true });
  } catch (error) {
    console.error('Error deleting reply:', error);
    res.status(500).json({ error: 'Error deleting reply' });
  }
});

/**
 * @swagger
 * /api/reviews/{reviewId}:
 *   delete:
 *     summary: Delete a review
 *     description: Allows the original author of a review to delete it permanently.
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the review
 *     responses:
 *       200:
 *         description: Review deleted successfully
 *       403:
 *         description: Access denied (not the review owner)
 *       404:
 *         description: Review not found
 */
router.delete('/:reviewId', authMiddleware, async (req, res) => {
  try {
    const { reviewId } = req.params;
    const review = await Review.findById(reviewId);

    if (!review) {
      return res.status(404).json({ error: 'Review not found' });
    }

    if (review.user.toString() !== req.user.userId) {
      return res.status(403).json({ error: 'Access denied - You cannot delete this review' });
    }

    await Review.findByIdAndDelete(reviewId);
    res.json({ success: true, message: 'Review deleted successfully' });
  } catch (err) {
    console.error('Error deleting review:', err);
    res.status(500).json({ error: 'Error deleting review' });
  }
});

module.exports = router;
