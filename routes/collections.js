const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const Trade = require('../models/Trade');
const mongoose = require('mongoose');
/**
 * @swagger
 * tags:
 *   name: Collections
 *   description: Manage user collections
 */

/**
 * @swagger
 * /api/collections:
 *   post:
 *     summary: Create a new collection for the user
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               mainCharacterId:
 *                 type: number
 *     responses:
 *       201:
 *         description: Collection created successfully
 *       400:
 *         description: Not enough character copies
 *       500:
 *         description: Server error
 */
router.post('/', authMiddleware, async (req, res) => {
    try {
        const { name, mainCharacterId } = req.body;
        const user = await User.findById(req.user.userId);
        const purchased = user.purchasedCharacters.find(pc => pc.characterId === mainCharacterId);
        const totalUsed = user.inventory.reduce((acc, col) => 
            acc + col.heroes.filter(id => id === mainCharacterId).length, 0
        );
        if (!purchased || totalUsed >= purchased.quantity) {
            return res.status(400).json({ error: 'You do not have enough copies for the main hero' });
        }
        const newCollection = {
            name,
            mainCharacterId,
            heroes: [mainCharacterId],
            displayedHeroes: [mainCharacterId]
        };
        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            { $push: { inventory: newCollection } },
            { new: true }
        );
        const createdCollection = updatedUser.inventory.slice(-1)[0];
        res.status(201).json(createdCollection);
    } catch (error) {
        res.status(500).json({ error: 'Error server' });
    }
});
/**
 * @swagger
 * /api/collections/{collectionId}/add-hero:
 *   put:
 *     summary: Add a hero to a specific collection slot
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionId
 *         required: true
 *         schema:
 *           type: string
 *         description: Collection ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               marvelId:
 *                 type: number
 *               slotIndex:
 *                 type: number
 *     responses:
 *       200:
 *         description: Hero added to collection
 *       400:
 *         description: Invalid slot or not enough copies
 *       500:
 *         description: Server error
 */
router.put('/:collectionId/add-hero', authMiddleware, async (req, res) => {
    try {
        const { marvelId, slotIndex } = req.body;
        const collectionId = req.params.collectionId;
        const user = await User.findById(req.user.userId);
        if (!user) return res.status(404).json({ error: 'User not found' });
        const collection = user.inventory.id(collectionId);
        if (!collection) return res.status(404).json({ error: 'Collection not found' });
        if (slotIndex < 0 || slotIndex >= collection.maxHeroes) {
            return res.status(400).json({ error: 'Invalid slot index' });
        }
        const purchased = user.purchasedCharacters.find(pc => pc.characterId === marvelId);
        const totalUsed = user.inventory.reduce((acc, col) => 
            acc + col.heroes.filter(id => id === marvelId).length, 0
        );
        if (!purchased || totalUsed >= purchased.quantity) {
            return res.status(400).json({ error: 'You do not have enough copies available' });
        }
        const oldHeroId = collection.displayedHeroes[slotIndex];
        if (oldHeroId) {
            collection.heroes = collection.heroes.filter(id => id !== oldHeroId);
        }
        collection.heroes.push(marvelId);
        collection.displayedHeroes[slotIndex] = marvelId;
        if (slotIndex === 0) {
            collection.mainCharacterId = marvelId;
        }
        await user.save();
        res.json({
            ...collection.toObject(),
            _id: collection._id.toString()
        });
    } catch (error) {
        console.error('Hero update error:', error);
        res.status(500).json({ error: 'Error server' });
    }
});
/**
 * @swagger
 * /api/collections/{collectionId}/remove-hero/{marvelId}:
 *   put:
 *     summary: Remove a hero from a collection
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: collectionId
 *         required: true
 *         schema:
 *           type: string
 *       - in: path
 *         name: marvelId
 *         required: true
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Hero removed
 *       404:
 *         description: Collection not found
 *       500:
 *         description: Server error
 */
router.put('/:collectionId/remove-hero/:marvelId', authMiddleware, async (req, res) => {
  try {
    const { collectionId, marvelId } = req.params;
    const marvelIdNum = parseInt(marvelId);
    const user = await User.findOneAndUpdate(
      {
        _id: req.user.userId,
        'inventory._id': collectionId
      },
      {
        $pull: {
          'inventory.$.heroes': { marvelId: marvelIdNum },
          'inventory.$.displayedHeroes': marvelIdNum
        }
      },
      { new: true, select: 'inventory' }
    );
    if (!user) {
      return res.status(404).json({ error: 'Collection not found' });
    }
    const updatedCollection = user.inventory.id(collectionId);
    res.json({
      ...updatedCollection.toObject(),
      _id: updatedCollection._id.toString()
    });
  } catch (error) {
    console.error('Error removing hero:', error);
    res.status(500).json({ error: 'Failed to remove hero' });
  }
});

/**
 * @swagger
 * /api/collections/my-collections:
 *   get:
 *     summary: Get authenticated user's collections
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of user's collections
 *       500:
 *         description: Server error
 */
router.get('/my-collections', authMiddleware, async (req, res) => {
    try {
      const user = await User.findById(req.user.userId)
        .populate('inventory')
        .lean();
      const collections = user.inventory.map(c => ({
        ...c,
        heroes: c.heroes.map(h => h.marvelId),
        displayedHeroes: c.displayedHeroes
      }));
      res.json(collections);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch collections' });
    }
  });
/**
 * @swagger
 * /api/collections/public:
 *   get:
 *     summary: Get public collections
 *     tags: [Collections]
 *     parameters:
 *       - in: query
 *         name: q
 *         schema:
 *           type: string
 *         description: Search query for collection name, description, or tags
 *     responses:
 *       200:
 *         description: List of public collections
 *       500:
 *         description: Server error
 */
router.get('/public', async (req, res) => {
  try {
    const { q } = req.query;
    const searchRegex = new RegExp(q || '', 'i');
    const result = await User.aggregate([
      { $unwind: '$inventory' },
      { 
        $match: { 
          'inventory.isPublic': true,
          $or: [
            { 'inventory.name': { $regex: searchRegex } },
            { 'inventory.description': { $regex: searchRegex } },
            { 'inventory.tags': { $regex: searchRegex } }
          ]
        } 
      },
      { 
        $project: {
          _id: 0,
          collection: '$inventory',
          user: { name: 1, avatar: 1 }
        }
      },
      { $sort: { 'collection.createdAt': -1 } },
      { $limit: 20 }
    ]);
    const publicCollections = result.map(item => ({
      ...item.collection,
      _id: item.collection._id.toString(),
      user: item.user
    }));
    res.json(publicCollections);
  } catch (error) {
    console.error('Error fetching public collections:', error);
    res.status(500).json({ error: 'Failed to fetch public collections' });
  }
});
/**
 * @swagger
 * /api/collections/{id}:
 *   put:
 *     summary: Update collection information
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name: { type: string }
 *               description: { type: string }
 *               tags: { type: array, items: { type: string } }
 *               maxHeroes: { type: number }
 *               displayedHeroes: { type: array, items: { type: number } }
 *               mainCharacterId: { type: number }
 *     responses:
 *       200:
 *         description: Collection updated
 *       404:
 *         description: Collection not found
 *       500:
 *         description: Server error
 */
router.put('/:id', authMiddleware, async (req, res) => {
    try {
      const updates = {
        'inventory.$.name': req.body.name,
        'inventory.$.description': req.body.description,
        'inventory.$.tags': req.body.tags,
        'inventory.$.maxHeroes': req.body.maxHeroes,
        'inventory.$.displayedHeroes': req.body.displayedHeroes,
        'inventory.$.mainCharacterId': req.body.mainCharacterId
      };
      const user = await User.findOneAndUpdate(
        { _id: req.user.userId, 'inventory._id': req.params.id },
        { $set: updates },
        { new: true }
      );
      if (!user) return res.status(404).json({ error: 'Collection not found' });
      const updatedCollection = user.inventory.id(req.params.id);
      res.json({
        ...updatedCollection.toObject(),
        _id: updatedCollection._id.toString()
      });
    } catch (error) {
      res.status(500).json({ error: 'Update error' });
    }
  });
  /**
 * @swagger
 * /api/collections/{id}:
 *   delete:
 *     summary: Delete a collection
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Collection deleted
 *       500:
 *         description: Server error
 */
  router.delete('/:id', authMiddleware, async (req, res) => {
    try {
      const collectionId = new mongoose.Types.ObjectId(req.params.id);
      const user = await User.findByIdAndUpdate(
        req.user.userId,
        { $pull: { inventory: { _id: collectionId } }},
        { new: true }
      );
      res.json({ message: 'Collection deleted' });
    } catch (error) {
      res.status(500).json({ error: 'Deletion error' });
    }
  });
/**
 * @swagger
 * /api/collections/{id}/remove-hero:
 *   put:
 *     summary: Remove a hero from a specific slot in the collection
 *     tags: [Collections]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               slotIndex:
 *                 type: number
 *     responses:
 *       200:
 *         description: Hero removed from slot
 *       500:
 *         description: Server error
 */
router.put('/:id/remove-hero', authMiddleware, async (req, res) => {
    try {
      const { slotIndex } = req.body;
      const collectionId = req.params.id;
      const user = await User.findOne({ _id: req.user.userId });
      const collection = user.inventory.id(collectionId);
      const heroId = collection.displayedHeroes[slotIndex];
      collection.displayedHeroes.splice(slotIndex, 1);
      collection.heroes.pull(heroId);
      await user.save();
      res.json({
        ...collection.toObject(),
        _id: collection._id.toString()
      });
    } catch (error) {
      res.status(500).json({ error: 'Error server' });
    }
  });
/**
 * @swagger
 * /api/collections/{id}:
 *   get:
 *     summary: Get a collection by ID
 *     tags: [Collections]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Collection data
 *       404:
 *         description: Collection not found
 *       500:
 *         description: Server error
 */
  router.get('/:id', async (req, res) => {
    try {
      const collectionId = req.params.id;
      const user = await User.findOne({ 'inventory._id': collectionId });
      if (user) {
        const collection = user.inventory.id(collectionId);
        if (collection) {
          console.log(`Found collection in user inventory: ${user._id}`);
          return res.json({
            ...collection.toObject(),
            _id: collection._id.toString()
          });
        }
      }
      const trade = await Trade.findOne({
        $or: [
          { 'offeredItems.collection._id': new mongoose.Types.ObjectId(collectionId) },
          { 'requestedItems.collection._id': new mongoose.Types.ObjectId(collectionId) }
        ]
      });
      if (trade) {
        console.log(`Found collection in trade: ${trade._id}`);
        const allItems = [...trade.offeredItems, ...trade.requestedItems];
        const collectionItem = allItems.find(
          item => item.type === 'collection' && item.collection?._id?.toString() === collectionId
        );
        if (collectionItem && collectionItem.collection) {
          return res.json({
            ...collectionItem.collection.toObject(),
            _id: collectionId
          });
        }
      }
      console.log(`Collection not found: ${collectionId}`);
      return res.status(404).json({ error: 'Collection not found' });
    } catch (error) {
      console.error('Error in GET /api/collections/:id', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  






module.exports = router;