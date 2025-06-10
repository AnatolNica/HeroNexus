// routes/favorites.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');

/**
 * @swagger
 * tags:
 *   name: Favorites
 *   description: User favorite characters management
 */

/**
 * @swagger
 * /favorites/{characterId}:
 *   post:
 *     summary: Toggle favorite character
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: characterId
 *         schema:
 *           type: integer
 *         required: true
 *         description: ID of the character to toggle
 *     responses:
 *       200:
 *         description: Favorite characters updated
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 favorites:
 *                   type: array
 *                   items:
 *                     type: integer
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/:characterId', authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    const characterId = Number(req.params.characterId);

    const user = await User.findById(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const index = user.favoriteCharacters.indexOf(characterId);
    if (index === -1) {
      user.favoriteCharacters.push(characterId);
    } else {
      user.favoriteCharacters.splice(index, 1);
    }

    await user.save();
    res.json({ favorites: user.favoriteCharacters });
  } catch (error) {
    console.error('Error updating favorites:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /favorites:
 *   get:
 *     summary: Get all favorite characters
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of favorite character IDs
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: integer
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select('favoriteCharacters');
    res.json(user.favoriteCharacters);
  } catch (error) {
    console.error('Error getting favorites:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

/**
 * @swagger
 * /favorites/merge:
 *   post:
 *     summary: Merge local favorite characters with server favorites
 *     tags: [Favorites]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               favorites:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: Local favorite character IDs to merge
 *     responses:
 *       200:
 *         description: Merged list of favorite characters
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 favorites:
 *                   type: array
 *                   items:
 *                     type: integer
 *       500:
 *         description: Server error
 */
router.post('/merge', authMiddleware, async (req, res) => {
  try {
    const localFavorites = req.body.favorites || [];
    const user = await User.findById(req.user.id);
    const merged = [...new Set([...user.favoriteCharacters, ...localFavorites])];
    user.favoriteCharacters = merged;

    await user.save();

    res.json({ favorites: user.favoriteCharacters });
  } catch (error) {
    console.error('Error merging favorites:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
