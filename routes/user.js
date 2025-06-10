const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const mongoose = require('mongoose');

/**
 * @swagger
 * /api/users/{userId}:
 *   get:
 *     summary: Get detailed public profile of a user
 *     description: Retrieves user profile data including friends, inventory, and purchased characters. Sensitive information such as email, password, cart, transactions, and payment methods is excluded. Only accessible to authenticated users.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: MongoDB ObjectId of the user to fetch
 *     responses:
 *       200:
 *         description: Successfully retrieved the user's public profile
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 avatar:
 *                   type: string
 *                 friends:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       avatar:
 *                         type: string
 *                       status:
 *                         type: string
 *                 purchasedCharacters:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       characterId:
 *                         type: integer
 *                       quantity:
 *                         type: integer
 *                 inventory:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       description:
 *                         type: string
 *                       isPublic:
 *                         type: boolean
 *                       tags:
 *                         type: array
 *                         items:
 *                           type: string
 *                       maxHeroes:
 *                         type: integer
 *                       mainCharacterId:
 *                         type: integer
 *                       displayedHeroes:
 *                         type: array
 *                         items:
 *                           type: integer
 *                       heroes:
 *                         type: array
 *                         items:
 *                           type: integer
 *                       createdAt:
 *                         type: string
 *                         format: date-time
 *       400:
 *         description: Invalid user ID format
 *       404:
 *         description: User not found
 *       500:
 *         description: Internal server error
 */
router.get('/:userId', authMiddleware, async (req, res) => {
  try {
    const { userId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(userId)) {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await User.findById(userId)
      .select('-password -email -paymentMethods -transactions -cart') 
      .populate({
        path: 'friends',
        select: 'name avatar status'
      })
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const transformedUser = {
      ...user,
      avatar: user.avatar ? `${process.env.BASE_URL}${user.avatar}` : null,
      purchasedCharacters: user.purchasedCharacters?.map(pc => ({
        characterId: pc.characterId,
        quantity: pc.quantity
      })) || [],
      inventory: user.inventory?.map(inv => ({
        _id: inv._id,
        name: inv.name,
        description: inv.description,
        isPublic: inv.isPublic || false,
        tags: inv.tags || [],
        maxHeroes: inv.maxHeroes || 12,
        mainCharacterId: inv.mainCharacterId,
        displayedHeroes: inv.displayedHeroes || [],
        heroes: inv.heroes || [],
        createdAt: inv.createdAt
      })) || []
    };

    res.json(transformedUser);

  } catch (error) {
    console.error('Error retrieving user profile:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
