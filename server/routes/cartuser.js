const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const User = require('../models/User');
const mongoose = require('mongoose');
const Offer = require('../models/Offer');
/**
 * @swagger
 * tags:
 *   name: Cart
 *   description: Cart operations (add, update, delete, checkout)
 */

/**
 * @swagger
 * /cart/add:
 *   post:
 *     summary: Add an item to the cart (character or offer)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [type, itemId, quantity]
 *             properties:
 *               type:
 *                 type: string
 *                 enum: [character, offer]
 *               itemId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Item added or updated in the cart
 *       400:
 *         description: Invalid input or cart full
 *       404:
 *         description: Item not found
 */
router.post('/add', authMiddleware, async (req, res) => {
  try {
    const { type, itemId, quantity } = req.body;
    const userId = req.user.id;
    if (!['character', 'offer'].includes(type)) {
      return res.status(400).json({ 
        success: false,
        error: 'Invalid product type' 
      });
    }
    const safeQuantity = Math.max(1, Math.min(Number(quantity), 100));
    const itemField = type === 'character' ? 'productId' : 'offerId';
    const itemValue = type === 'character' 
      ? Number(itemId)
      : new mongoose.Types.ObjectId(itemId);
    if (type === 'offer') {
      const offerExists = await Offer.exists({ _id: itemValue });
      if (!offerExists) {
        return res.status(404).json({
          success: false,
          error: 'Offer does not exist'
        });
      }
    }
    let user = await User.findOneAndUpdate(
      { _id: userId, [`cart.items.${itemField}`]: itemValue },
      { $inc: { 'cart.items.$.quantity': safeQuantity } },
      { new: true, runValidators: true }
    );
    if (!user) {
      user = await User.findByIdAndUpdate(
        userId,
        {
          $push: { 
            'cart.items': {
              type,
              [itemField]: itemValue,
              quantity: safeQuantity
            }
          },
          $set: { 'cart.updatedAt': new Date() }
        },
        { new: true, runValidators: true }
      );
      if (user.cart.items.length > 100) {
        await User.updateOne(
          { _id: userId },
          { $pop: { 'cart.items': 1 } }
        );
        return res.status(400).json({
          success: false,
          error: 'Cart full (maximum 100 items)'
        });
      }
    }
    const cartItem = user.cart.items.find(item => {
      if (item.type === 'offer') {
        return item.offerId.equals(itemValue);
      }
      return item.productId === itemValue;
    });
    
    if (!cartItem) {
      return res.status(404).json({
        success: false,
        error: 'Item not found in cart'
      });
    }
    if (cartItem.quantity > 100) {
      await User.updateOne(
        { _id: userId, [`cart.items.${itemField}`]: itemValue },
        { $set: { 'cart.items.$.quantity': 100 } }
      );
      return res.status(400).json({
        success: false,
        error: 'Maximum quantity exceeded'
      });
    }
    res.json({
      success: true,
      cart: user.cart
    });
  } catch (error) {
    console.error('Error adding to cart:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Internal server error'
    });
  }
});
/**
 * @swagger
 * /cart:
 *   get:
 *     summary: Get the current user's cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart retrieved
 *       500:
 *         description: Server error
 */
router.get('/', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('cart.items.offerId')
      .lean();
    const processedItems = user.cart.items.map(item => ({
      type: item.type,
      id: item.type === 'offer' 
           ? item.offerId._id.toString() 
           : item.productId,
      quantity: item.quantity,
      details: item.type === 'offer' ? item.offerId : null
    }));
    res.json({
      success: true,
      cart: {
        items: processedItems,
        updatedAt: user.cart.updatedAt
      }
    });
  } catch (error) {
    console.error('Error retrieving cart:', error);
    res.status(500).json({ success: false, error: 'Server error' });
  }
});
/**
 * @swagger
 * /cart/update/{type}/{itemId}:
 *   put:
 *     summary: Update quantity of an item in the cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         schema:
 *           type: string
 *           enum: [character, offer]
 *         required: true
 *       - in: path
 *         name: itemId
 *         schema:
 *           type: string
 *         required: true
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Quantity updated
 *       404:
 *         description: Item not found
 */
router.put('/update/:type/:itemId', authMiddleware, async (req, res) => {
  try {
    const { type, itemId } = req.params;
    const { quantity } = req.body;
    if (!['character', 'offer'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid product type' });
    }
    const safeQuantity = Math.max(1, Math.min(Number(quantity), 100));
    const itemField = type === 'character' ? 'productId' : 'offerId';

    let itemValue;

    if (type === 'character') {
      itemValue = Number(itemId);
      if (isNaN(itemValue)) {
        return res.status(400).json({ success: false, error: 'Invalid character ID' });
      }
    } else {
      if (!mongoose.Types.ObjectId.isValid(itemId)) {
        return res.status(400).json({ success: false, error: 'Invalid offer ID' });
      }
      itemValue = new mongoose.Types.ObjectId(itemId);
    }
    const user = await User.findOneAndUpdate(
      { _id: req.user.id, [`cart.items.${itemField}`]: itemValue },
      { $set: { 'cart.items.$.quantity': safeQuantity, 'cart.updatedAt': new Date() } },
      { new: true, runValidators: true }
    );
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Product not found in cart'
      });
    }
    res.json({
      success: true,
      message: 'Quantity updated',
      cart: user.cart
    });
  } catch (error) {
    console.error('Error updating quantity:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Errore server'
    });
  }
});
/**
 * @swagger
 * /cart/remove/{type}/{itemId}:
 *   delete:
 *     summary: Remove an item from the cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: type
 *         schema:
 *           type: string
 *           enum: [character, offer]
 *         required: true
 *       - in: path
 *         name: itemId
 *         schema:
 *           type: string
 *         required: true
 *     responses:
 *       200:
 *         description: Item removed from cart
 *       404:
 *         description: User or item not found
 */
router.delete('/remove/:type/:itemId', authMiddleware, async (req, res) => {
  try {
    const { type, itemId } = req.params;
    if (!['character', 'offer'].includes(type)) {
      return res.status(400).json({ success: false, error: 'Invalid product type' });
    }
    const itemField = type === 'character' ? 'productId' : 'offerId';
    let itemValue;
    if (type === 'character') {
      itemValue = Number(itemId);
      if (isNaN(itemValue)) {
        return res.status(400).json({ success: false, error: 'Invalid character ID' });
      }
    } else {
      if (!mongoose.Types.ObjectId.isValid(itemId)) {
        return res.status(400).json({ success: false, error: 'Invalid offer ID' });
      }
      itemValue = new mongoose.Types.ObjectId(itemId);
    }
    const user = await User.findOneAndUpdate(
      { _id: req.user.id },
      { $pull: { 'cart.items': { [itemField]: itemValue } }, $set: { 'cart.updatedAt': new Date() } },
      { new: true }
    );
    if (!user) {
      return res.status(404).json({ success: false, error: 'User does not exist' });
    }
    res.json({
      success: true,
      message: 'Product removed from cart',
      cart: user.cart
    });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Error server'
    });
  }
});
/**
 * @swagger
 * /cart/add-offer:
 *   post:
 *     summary: Add a special offer to the cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [offerId, quantity]
 *             properties:
 *               offerId:
 *                 type: string
 *               quantity:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Offer added to cart
 *       404:
 *         description: Offer not found
 */
router.post('/add-offer', authMiddleware, async (req, res) => {
  try {
    const { offerId, quantity } = req.body;
    const userId = req.user.id;
    if (!mongoose.Types.ObjectId.isValid(offerId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid offer ID'
      });
    }
    const safeQuantity = Math.max(1, Math.min(Number(quantity), 100));
    const offerObjectId = new mongoose.Types.ObjectId(offerId);
    const offerExists = await Offer.exists({ _id: offerObjectId });
    if (!offerExists) {
      return res.status(404).json({
        success: false,
        error: 'Offer does not exist'
      });
    }
    const result = await User.findOneAndUpdate(
      {
        _id: userId,
        'cart.items.offerId': offerObjectId
      },
      {
        $inc: { 'cart.items.$.quantity': safeQuantity },
        $set: { 'cart.updatedAt': new Date() }
      },
      { new: true, runValidators: true }
    );
    if (!result) {
      const newUser = await User.findByIdAndUpdate(
        userId,
        {
          $push: {
            'cart.items': {
              type: 'offer',
              offerId: offerObjectId,
              quantity: safeQuantity
            }
          },
          $set: { 'cart.updatedAt': new Date() }
        },
        { new: true, runValidators: true }
      );
      return res.json({
        success: true,
        cart: newUser.cart
      });
    }
    const item = result.cart.items.find(i => 
      i.offerId.equals(offerObjectId)
    );
    if (!item) {
      return res.status(404).json({
        success: false,
        error: 'Offer could not be added'
      });
    }
    if (item.quantity > 100) {
      await User.updateOne(
        { _id: userId, 'cart.items.offerId': offerObjectId },
        { $set: { 'cart.items.$.quantity': 100 } }
      );
      return res.status(400).json({
        success: false,
        error: 'Maximum quantity exceeded (100)'
      });
    }
    res.json({
      success: true,
      cart: result.cart
    });
  } catch (error) {
    console.error('Error adding offer:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Server error'
    });
  }
});
/**
 * @swagger
 * /cart/checkout:
 *   post:
 *     summary: Finalize the purchase and empty the cart
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Purchase completed
 *       400:
 *         description: Cart is empty or insufficient funds
 *       404:
 *         description: User not found
 */
router.post('/checkout', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('cart.items.offerId')
      .select('cart coins transactions purchasedCharacters');
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'User not found'
      });
    }
    if (user.cart.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'The cart is empty'
      });
    }
    let totalCoins = 0;
    let totalPrice = 0;
    const purchasedItems = [];
    const characterQuantities = new Map();
    for (const item of user.cart.items) {
      if (item.type === 'offer') {
        const offer = item.offerId;
        if (!offer) continue;
        const quantity = item.quantity;
        const coinsEarned = (offer.coins + (offer.bonus || 0)) * quantity;
        totalCoins += coinsEarned;
        totalPrice += offer.price * quantity;
        purchasedItems.push({
          type: 'offer',
          title: offer.title,
          quantity,
          coins: coinsEarned,
          price: offer.price * quantity
        });
      } else if (item.type === 'character') {
        const characterId = item.productId;
        const quantity = item.quantity;
        const price = item.details?.price || 0;
        totalPrice += price * quantity;
        const currentQty = characterQuantities.get(characterId) || 0;
        characterQuantities.set(characterId, currentQty + quantity);
        purchasedItems.push({
          type: 'character',
          id: characterId,
          quantity,
          price: price * quantity
        });
      }
    }
    user.coins += totalCoins;
    const existingCharacters = new Map();
    (user.purchasedCharacters || []).forEach(c => {
      if (typeof c === 'number') {
        existingCharacters.set(c.toString(), 1);
      } else if (c.characterId) {
        existingCharacters.set(c.characterId.toString(), c.quantity);
      }
    });
    characterQuantities.forEach((qty, charId) => {
      const current = existingCharacters.get(charId.toString()) || 0;
      existingCharacters.set(charId.toString(), current + qty);
    });
    user.purchasedCharacters = Array.from(existingCharacters.entries()).map(([characterId, quantity]) => ({
      characterId: Number(characterId),
      quantity
    }));
    user.transactions.push({
      amount: -totalPrice,
      description: `Cart purchase (#${Date.now()})`,
      status: 'completed',
      details: {
        items: purchasedItems,
        totalCoins,
        totalPrice,
        charactersObtained: Array.from(characterQuantities.entries()).map(([id, qty]) => ({
          characterId: Number(id),
          quantity: qty
        }))
      }
    });
    user.cart.items = [];
    user.cart.updatedAt = new Date();
    await user.save();
    const totalCharacters = Array.from(characterQuantities.values()).reduce((sum, qty) => sum + qty, 0);
    res.json({
      success: true,
      message: `Successful purchase ${totalCharacters} new characters unlocked`,
      coins: user.coins,
      purchasedCharacters: Array.from(characterQuantities.entries()).map(([id, qty]) => ({
        characterId: Number(id),
        quantity: qty
      })),
      transactionId: user.transactions.slice(-1)[0]._id
    });
  } catch (error) {
    console.error('Checkout error:', error);
    res.status(500).json({ 
      success: false,
      error: error.message || 'Payment processing error' 
    });
  }
});
/**
 * @swagger
 * /cart/checkout/characters:
 *   post:
 *     summary: Checkout characters using virtual coins
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     description: Purchases character items in the user's cart using coins. Updates inventory and deducts the total cost from user's balance.
 *     responses:
 *       200:
 *         description: Checkout successful, characters added
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 newBalance:
 *                   type: number
 *       400:
 *         description: No characters in cart or insufficient coins
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/checkout/characters', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('cart.items.offerId')
      .select('cart coins purchasedCharacters');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const characterItems = user.cart.items.filter(item => item.type === 'character');
    if (characterItems.length === 0) {
      return res.status(400).json({ error: 'No characters in cart' });
    }
    let totalCost = 0;
    const characterMap = new Map();
    const MarvelFigure = mongoose.model('MarvelFigure');
    for (const item of characterItems) {
      let char = item.details;
      let price = 1;
      if (!char) {
        try {
          char = await MarvelFigure.findOne({ marvelId: item.productId });
          price = char?.price || 1;
        } catch (error) {
          console.error('Character search error:', error);
          price = 1;
        }
      } else {
        price = char.price || 1;
      }
      totalCost += price * item.quantity;
      const charId = char?.marvelId || item.productId;
      if (characterMap.has(charId)) {
        characterMap.set(charId, characterMap.get(charId) + item.quantity);
      } else {
        characterMap.set(charId, item.quantity);
      }
    }
    if (user.coins < totalCost) {
      return res.status(400).json({ error: 'Insufficient coins' });
    }
    user.coins -= totalCost;
    characterMap.forEach((quantity, charId) => {
      const existing = user.purchasedCharacters.find(c => c.characterId === charId);
      existing ? existing.quantity += quantity : user.purchasedCharacters.push({ 
        characterId: charId, 
        quantity 
      });
    });
    user.cart.items = user.cart.items.filter(item => item.type !== 'character');
    await user.save();
    res.json({ 
      success: true,
      message: `Successful purchase ${characterMap.size} Characters added`,
      newBalance: user.coins
    });
  } catch (error) {
    console.error('Character checkout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
/**
 * @swagger
 * /cart/checkout/offers:
 *   post:
 *     summary: Checkout offers (real payment)
 *     tags: [Cart]
 *     security:
 *       - bearerAuth: []
 *     description: Finalizes offer purchases. Grants coins and any included characters to the user and clears the cart of offers.
 *     responses:
 *       200:
 *         description: Offer purchase successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 newBalance:
 *                   type: number
 *       400:
 *         description: No offers in cart
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.post('/checkout/offers', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.id)
      .populate('cart.items.offerId')
      .select('cart coins purchasedCharacters');
    if (!user) return res.status(404).json({ error: 'User not found' });
    const offerItems = user.cart.items.filter(item => item.type === 'offer');
    if (offerItems.length === 0) {
      return res.status(400).json({ error: 'No offers in cart' });
    }
    let totalPrice = 0;
    let totalCoins = 0;
    const characterMap = new Map();
    for (const item of offerItems) {
      const offer = item.offerId;
      totalPrice += (offer.price || 0) * item.quantity;
      totalCoins += (offer.coins + (offer.bonus || 0)) * item.quantity;
      if (offer.includedCharacters) {
        offer.includedCharacters.forEach(charId => {
          if (characterMap.has(charId)) {
            characterMap.set(charId, characterMap.get(charId) + item.quantity);
          } else {
            characterMap.set(charId, item.quantity);
          }
        });
      }
    }
    user.coins += totalCoins;
    characterMap.forEach((quantity, charId) => {
      const existing = user.purchasedCharacters.find(c => c.characterId === charId);
      if (existing) {
        existing.quantity += quantity;
      } else {
        user.purchasedCharacters.push({ characterId: charId, quantity });
      }
    });
    user.cart.items = user.cart.items.filter(item => item.type !== 'offer');
    await user.save();
    res.json({ 
      success: true,
      message: `Payment successful +${totalCoins} coins received`,
      newBalance: user.coins
    });
  } catch (error) {
    console.error('Offer checkout error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});



module.exports = router;