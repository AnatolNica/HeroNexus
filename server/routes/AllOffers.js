// backend/routes/AllOffers.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Offer = require('../models/Offer');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
/**
 * @swagger
 * tags:
 *   name: Offers
 *   description: API to manage offers
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
 * /offers:
 *   get:
 *     summary: Get a list of offers
 *     tags: [Offers]
 *     parameters:
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Limit the number of offers returned
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *         description: Sort order of offers (e.g. "-createdAt")
 *       - in: query
 *         name: type
 *         schema:
 *           type: string
 *         description: Filter offers by type
 *     responses:
 *       200:
 *         description: List of offers
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 count:
 *                   type: integer
 *                 offers:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Offer'
 *       500:
 *         description: Server error retrieving offers
 * 
 */
router.get('/', async (req, res) => {
    try {
      const { limit, sort, type } = req.query;
      const query = {};
      
      if (type) query.type = type;
  
      const hasCharacterModel = mongoose.models.Character ? true : false;
      
      const offers = await Offer.find(query)
        .populate(hasCharacterModel ? {
          path: 'includedCharacters',
          select: 'name image',

          match: { _id: { $exists: true } }
        } : '')
        .limit(parseInt(limit) || 0)
        .sort(sort || '-createdAt')
        .lean();
  
      res.json({
        success: true,
        count: offers.length,
        offers
      });
    } catch (error) {
      console.error('Error retrieving offers:', error);
      res.status(500).json({ 
        success: false,
        error: error.message || 'Server error retrieving offers'
      });
    }
  });
/**
 * @swagger
 * /offers/{id}:
 *   get:
 *     summary: Get a single offer by ID
 *     tags: [Offers]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Offer ID
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Offer found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 offer:
 *                   $ref: '#/components/schemas/Offer'
 *       404:
 *         description: Offer not found
 *       500:
 *         description: Server error retrieving offer
 */
router.get('/:id', async (req, res) => {
  try {
    
    const offer = await Offer.findById(req.params.id)
      .populate('includedCharacters', 'name image rarity')
      .lean();

    if (!offer) {
      return res.status(404).json({ 
        success: false,
        error: 'Offer not found' 
      });
    }

    res.json({ 
      success: true,
      offer 
    });
  } catch (error) {
    console.error('Error retrieving offer:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error retrieving offer' 
    });
  }
});
/**
 * @swagger
 * /offers:
 *   post:
 *     summary: Create a new offer (admin only)
 *     tags: [Offers]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Offer data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - title
 *               - type
 *               - coins
 *               - price
 *             properties:
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *               coins:
 *                 type: number
 *               price:
 *                 type: number
 *               popularity:
 *                 type: number
 *             example:
 *               title: "Super Offer"
 *               type: "coins"
 *               coins: 500
 *               price: 4.99
 *               popularity: 4.5
 *     responses:
 *       201:
 *         description: Offer created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 offer:
 *                   $ref: '#/components/schemas/Offer'
 *       400:
 *         description: Missing required fields
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 *       500:
 *         description: Server error creating offer
 */
router.post('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const { title, type, coins, price, popularity } = req.body;

    if (!title || !type || !coins || !price) {
      return res.status(400).json({ 
        success: false,
        error: 'Mandatory fields are missing' 
      });
    }

    const sanitizedBody = { ...req.body };
    delete sanitizedBody._id;

    const newOffer = new Offer({
      ...sanitizedBody,
      popularity: popularity || 4.0,
    });

    const savedOffer = await newOffer.save();
    res.status(201).json({ 
      success: true,
      message: 'Offer successfully created',
      offer: savedOffer 
    });
  } catch (error) {
    console.error('Error creating offer:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error creating offer' 
    });
  }
});

/**
 * @swagger
 * /offers/{id}:
 *   put:
 *     summary: Update an offer by ID (admin only)
 *     tags: [Offers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Offer ID to update
 *         schema:
 *           type: string
 *     requestBody:
 *       description: Offer fields to update
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               type:
 *                 type: string
 *               coins:
 *                 type: number
 *               price:
 *                 type: number
 *               popularity:
 *                 type: number
 *     responses:
 *       200:
 *         description: Offer updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 offer:
 *                   $ref: '#/components/schemas/Offer'
 *       404:
 *         description: Offer not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 *       500:
 *         description: Server error updating offer
 */
router.put('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const updatedOffer = await Offer.findByIdAndUpdate(
      req.params.id,
      { $set: req.body },
      { new: true, runValidators: true }
    );

    if (!updatedOffer) {
      return res.status(404).json({ 
        success: false,
        error: 'Offer not found' 
      });
    }

    res.json({ 
      success: true,
      message: 'Offer updated',
      offer: updatedOffer 
    });
  } catch (error) {
    console.error('Error updating offer:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error updating offer' 
    });
  }
});
/**
 * @swagger
 * /offers/{id}:
 *   delete:
 *     summary: Delete an offer by ID (admin only)
 *     tags: [Offers]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Offer ID to delete
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Offer deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 id:
 *                   type: string
 *       404:
 *         description: Offer not found
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden (not admin)
 *       500:
 *         description: Server error deleting offer
 */
router.delete('/:id', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const deletedOffer = await Offer.findByIdAndDelete(req.params.id);
    
    if (!deletedOffer) {
      return res.status(404).json({ 
        success: false,
        error: 'Offer not found' 
      });
    }

    res.json({ 
      success: true,
      message: 'Offer successfully deleted',
      id: req.params.id 
    });
  } catch (error) {
    console.error('Error deleting offer:', error);
    res.status(500).json({ 
      success: false,
      error: 'Server error deleting offer' 
    });
  }
});

module.exports = router;