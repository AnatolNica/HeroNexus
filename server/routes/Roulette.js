// backend/routes/Roulette.js
const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Roulette = require('../models/Roulette');
const { check, validationResult } = require('express-validator');
const User = require('../models/User');

/**
 * @swagger
 * tags:
 *   name: Roulette
 *   description: Roulette system endpoints
 */

const validateRoulette = [
  check('name').notEmpty().withMessage('Name is required'),
  check('image').isURL().withMessage('Image must be a valid URL'),
  check('category').isIn(['Heroes', 'Villains', 'Weapons', 'Special']),
  check('price').isFloat({ min: 0.99 }),
  check('items').isArray({ min: 1 }),
  check('items.*.heroId').notEmpty(),
  check('items.*.chance').isFloat({ min: 0, max: 1 })
];

/**
 * @swagger
 * /api/roulette:
 *   get:
 *     summary: Get all roulettes
 *     tags: [Roulette]
 *     responses:
 *       200:
 *         description: List of roulettes
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 data:
 *                   type: array
 */
router.get('/', async (req, res) => {
  try {
    const roulettes = await Roulette.find().sort('-createdAt');
    res.json({ success: true, data: roulettes });
  } catch (error) {
    res.status(500).json({ success: false, error: 'Server Error' });
  }
});

/**
 * @swagger
 * /api/roulette:
 *   post:
 *     summary: Create a new roulette (Admin only)
 *     tags: [Roulette]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, image, category, price, items]
 *             properties:
 *               name:
 *                 type: string
 *               image:
 *                 type: string
 *               category:
 *                 type: string
 *                 enum: [Heroes, Villains, Weapons, Special]
 *               price:
 *                 type: number
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required: [heroId, chance]
 *                   properties:
 *                     heroId:
 *                       type: number
 *                     chance:
 *                       type: number
 *     responses:
 *       201:
 *         description: Roulette created successfully
 *       400:
 *         description: Validation failed
 */
router.post('/', authMiddleware, validateRoulette, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  try {
    const { items } = req.body;
    const totalChance = items.reduce((sum, item) => sum + item.chance, 0);

    if (Math.abs(totalChance - 1) > 0.001) {
      return res.status(400).json({
        success: false,
        error: 'Total chance must equal 1 (100%)'
      });
    }

    const roulette = new Roulette(req.body);
    await roulette.save();
    res.status(201).json({ success: true, data: roulette });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/roulette/{id}:
 *   get:
 *     summary: Get a specific roulette by ID
 *     tags: [Roulette]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Roulette retrieved
 *       404:
 *         description: Roulette not found
 */
router.get('/:id', async (req, res) => {
  try {
    const roulette = await Roulette.findById(req.params.id);
    if (!roulette) {
      return res.status(404).json({ success: false, error: 'Roulette not found' });
    }
    res.json({ success: true, data: roulette });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/roulette/{id}:
 *   put:
 *     summary: Update a roulette by ID (Admin only)
 *     tags: [Roulette]
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
 *             $ref: '#/components/schemas/Roulette'
 *     responses:
 *       200:
 *         description: Roulette updated
 *       404:
 *         description: Roulette not found
 */
router.put('/:id', authMiddleware, validateRoulette, async (req, res) => {
  try {
    const roulette = await Roulette.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );

    if (!roulette) {
      return res.status(404).json({ success: false, error: 'Roulette not found' });
    }

    res.json({ success: true, data: roulette });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/roulette/{id}:
 *   delete:
 *     summary: Delete a roulette by ID (Admin only)
 *     tags: [Roulette]
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
 *         description: Roulette deleted
 *       404:
 *         description: Roulette not found
 */
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const roulette = await Roulette.findByIdAndDelete(req.params.id);
    if (!roulette) {
      return res.status(404).json({ success: false, error: 'Roulette not found' });
    }
    res.json({ success: true, data: {} });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * @swagger
 * /api/roulette/{id}/spin:
 *   post:
 *     summary: Spin a roulette and receive a reward (Authenticated users)
 *     tags: [Roulette]
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
 *         description: Spin successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 newBalance:
 *                   type: number
 *                 wonCharacter:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: number
 *                     quantity:
 *                       type: number
 *                     firstObtained:
 *                       type: string
 *                       format: date-time
 *                 timestamp:
 *                   type: string
 *       400:
 *         description: Insufficient funds or invalid input
 *       404:
 *         description: Roulette or user not found
 */
router.post('/:id/spin', authMiddleware, async (req, res) => {
  try {
    const [roulette, user] = await Promise.all([
      Roulette.findById(req.params.id),
      User.findById(req.user.id)
    ]);

    if (!roulette || !user) {
      return res.status(404).json({
        success: false,
        error: 'Roulette or user does not exist'
      });
    }

    if (user.coins < roulette.price) {
      return res.status(400).json({
        success: false,
        error: 'Insufficient funds for this spin'
      });
    }

    user.coins -= roulette.price;
    const winner = selectWinner(roulette.items);
    updatePurchasedCharacters(user, winner);
    await user.save();

    const response = prepareResponse(user, winner);
    res.json(response);
  } catch (error) {
    handleError(res, error);
  }
});

function selectWinner(items) {
  const rand = Math.random();
  let cumulative = 0;
  for (const item of items) {
    cumulative += item.chance;
    if (rand < cumulative) return Number(item.heroId);
  }
  return Number(items[items.length - 1].heroId);
}

function updatePurchasedCharacters(user, winnerId) {
  const numericWinnerId = Number(winnerId);
  const existingIndex = user.purchasedCharacters.findIndex(
    c => c.characterId === numericWinnerId
  );

  if (existingIndex > -1) {
    user.purchasedCharacters[existingIndex].quantity++;
  } else {
    user.purchasedCharacters.push({
      characterId: numericWinnerId,
      quantity: 1,
      obtainedAt: new Date()
    });
  }
}

function prepareResponse(user, winnerId) {
  const numericWinnerId = Number(winnerId);
  const wonCharacter = user.purchasedCharacters.find(
    c => c.characterId === numericWinnerId
  );

  if (!wonCharacter) {
    throw new Error('Internal error: Won character was not added properly');
  }

  return {
    success: true,
    newBalance: user.coins,
    wonCharacter: {
      id: numericWinnerId,
      quantity: wonCharacter.quantity,
      firstObtained: wonCharacter.obtainedAt || new Date()
    },
    timestamp: new Date().toISOString()
  };
}

function handleError(res, error) {
  console.error('Spin error:', error);
  const statusCode = error.name === 'ValidationError' ? 400 : 500;
  const message = error.message || 'Internal server error';
  res.status(statusCode).json({ success: false, error: message });
}

module.exports = router;
