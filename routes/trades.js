const express = require('express');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const Trade = require('../models/Trade');
const User = require('../models/User');
const mongoose = require('mongoose');
/**
 * @swagger
 * tags:
 *   name: Trades
 *   description: Marketplace trades management
 */
function countLockedCharacters(user, characterId, excludeCollectionIds = new Set()) {
    const charIdNum = Number(characterId);
    return user.inventory.reduce((count, collection) => {
      if (excludeCollectionIds.has(collection._id.toString())) {
        return count;
      }
      if (collection.heroes?.some(id => Number(id) === charIdNum)) {
        return count + 1;
      }
      return count;
    }, 0);
  }
async function processTradeItems(user, items, session) {
    const collectionsMap = new Map();
    user.inventory.forEach(collection => {
      collectionsMap.set(collection._id.toString(), collection);
    });
    const tradedCollectionIds = new Set(
        items
          .filter(item => item.type === 'collection')
          .map(item => item.collectionId.toString()) 
      );
    const processedItems = await Promise.all(items.map(async (item) => {
      if (item.type === 'collection') {
        const collection = collectionsMap.get(item.collectionId);
        if (!collection) {
          throw new Error(`Collection ${item.collectionId} not found`);
        }
        return {
            type: item.type,
            collection: {
              ...collection.toObject(),
              _id: collection._id.toString(),
              heroes: [...collection.heroes],
              name: collection.name,
              mainCharacterId: collection.mainCharacterId
            },
            collectionId: item.collectionId,
            quantity: item.quantity
          };
      }
      return item;
    }));
    for (const item of processedItems) {
      if (item.type === 'character') {
        const characterId = Number(item.characterId);
        const charItem = user.purchasedCharacters.find(c => 
          Number(c.characterId) === characterId
        );
        
        if (!charItem) {
          throw new Error(`Character ${item.characterId} not found`);
        }
        const currentExcluded = new Set(tradedCollectionIds);
if (item.type === 'collection') {
  currentExcluded.add(item.collectionId.toString());
}
const lockedCount = countLockedCharacters(user, characterId, currentExcluded);
        const ownedQty = charItem.quantity;
        const availableQty = ownedQty - lockedCount;
        if (availableQty < (item.quantity || 1)) {
          throw new Error(`Insufficient available characters. You have ${availableQty} available (${ownedQty} owned, ${lockedCount} locked in collections)`);
        }
      }
      else if (item.type === 'coins' && user.coins < item.coins) {
        throw new Error('Insufficient coins');
      }
      else if (item.type === 'collection') {
        const collectionExists = collectionsMap.has(item.collectionId);
        if (!collectionExists) {
          throw new Error(`Collection ${item.collectionId} not found`);
        }
        const collection = collectionsMap.get(item.collectionId);
        for (const charId of collection.heroes) {
            const characterId = Number(charId);
            const charItem = user.purchasedCharacters.find(c => Number(c.characterId) === characterId);
          
            if (!charItem) {
              throw new Error(`Character ${characterId} in collection not found`);
            }
            const excludeIds = new Set(tradedCollectionIds);
            excludeIds.add(item.collectionId.toString());
            const lockedCount = countLockedCharacters(user, characterId, excludeIds);
            const availableQty = charItem.quantity - lockedCount;
            if (availableQty < 1) {
              throw new Error(`Insufficient available characters for ${characterId} in collection. You have ${availableQty} available (${charItem.quantity} owned, ${lockedCount} locked)`);
            }
          if (availableQty < 1) {
            throw new Error(`Insufficient available characters for ${characterId} in collection. You have ${availableQty} available (${charItem.quantity} owned, ${lockedCount} locked)`);
          }
        }
      }
    }
    for (const item of processedItems) {
      if (item.type === 'character') {
        const characterId = Number(item.characterId);
        const charIndex = user.purchasedCharacters.findIndex(c => 
          Number(c.characterId) === characterId
        );
        const char = user.purchasedCharacters[charIndex];
        char.quantity -= item.quantity || 1;
        if (char.quantity === 0) {
          user.purchasedCharacters.splice(charIndex, 1);
        }
      }
      else if (item.type === 'coins') {
        user.coins -= item.coins;
      }
      else if (item.type === 'collection') {
        const collectionIndex = user.inventory.findIndex(c => 
          c._id.toString() === item.collectionId
        );
        if (collectionIndex !== -1) {
          user.inventory.splice(collectionIndex, 1);
        }
        const collection = collectionsMap.get(item.collectionId);
        for (const charId of collection.heroes) {
          const characterId = Number(charId);
          const charIndex = user.purchasedCharacters.findIndex(c => 
            Number(c.characterId) === characterId
          );
          if (charIndex !== -1) {
            const char = user.purchasedCharacters[charIndex];
            char.quantity -= 1;
            
            if (char.quantity === 0) {
              user.purchasedCharacters.splice(charIndex, 1);
            }
          }
        }
      }
    }
    return processedItems;
  }

  async function transferRequestedItems(fromUser, toUser, items, session) {
    const charMap = new Map();
    fromUser.purchasedCharacters.forEach((char, index) => {
      charMap.set(Number(char.characterId), { char, index });
    });
    const tradedCollectionIds = new Set(
      items
        .filter(item => item.type === 'collection')
        .map(item => item.collectionId)
    );
    for (const item of items) {
      if (item.type === 'character') {
        const charId = Number(item.characterId);
        const charData = charMap.get(charId);
        
        if (!charData) {
          throw new Error(`Character ${charId} not found in sender's inventory`);
        }
        
        const lockedCount = countLockedCharacters(fromUser, charId, tradedCollectionIds);
        const availableQty = charData.char.quantity - lockedCount;
        const requiredQty = item.quantity || 1;
        
        if (availableQty < requiredQty) {
          throw new Error(
            `Insufficient available characters for ID ${charId}. ` +
            `Available: ${availableQty} (Owned: ${charData.char.quantity}, ` +
            `Locked: ${lockedCount})`
          );
        }
      } 
      else if (item.type === 'coins') {
        if (fromUser.coins < item.coins) {
          throw new Error(
            `Insufficient coins. Required: ${item.coins}, Available: ${fromUser.coins}`
          );
        }
      } 
      else if (item.type === 'collection') {
        const collection = fromUser.inventory.find(
          c => c._id.toString() === item.collectionId
        );
        
        if (!collection) {
          throw new Error(`Collection ${item.collectionId} not found`);
        }
        const charCountMap = new Map();
        for (const charId of collection.heroes) {
          const id = Number(charId);
          charCountMap.set(id, (charCountMap.get(id) || 0) + 1);
        }
        for (const [charId, required] of charCountMap) {
          const charData = charMap.get(charId);
          
          if (!charData) {
            throw new Error(`Character ${charId} in collection not found`);
          }
          const currentExcluded = new Set(tradedCollectionIds);
          if (item.type === 'collection') {
           currentExcluded.add(item.collectionId.toString());
          }
          const lockedCount = countLockedCharacters(fromUser, charId, currentExcluded);
          const availableQty = charData.char.quantity - lockedCount;
          if (availableQty < required) {
            throw new Error(
              `Insufficient available characters for ${charId} in collection. ` +
              `Required: ${required}, Available: ${availableQty} ` +
              `(Owned: ${charData.char.quantity}, Locked: ${lockedCount})`
            );
          }
        }
      }
    }
    
    for (const item of items) {
      if (item.type === 'character') {
        const charId = Number(item.characterId);
        const { char, index } = charMap.get(charId);
        const transferQty = item.quantity || 1;
        char.quantity -= transferQty;
        if (char.quantity === 0) {
          fromUser.purchasedCharacters.splice(index, 1);
          charMap.delete(charId);
        }
        const toCharIndex = toUser.purchasedCharacters.findIndex(
          c => Number(c.characterId) === charId
        );
        if (toCharIndex !== -1) {
          toUser.purchasedCharacters[toCharIndex].quantity += transferQty;
        } else {
          toUser.purchasedCharacters.push({
            characterId: charId,
            quantity: transferQty
          });
        }
      } 
      else if (item.type === 'coins') {
        fromUser.coins -= item.coins;
        toUser.coins += item.coins;
      } 
      else if (item.type === 'collection') {
        const collectionIndex = fromUser.inventory.findIndex(
          c => c._id.toString() === item.collectionId
        );
        if (collectionIndex !== -1) {
          const [collection] = fromUser.inventory.splice(collectionIndex, 1);
          const newCollection = {
            ...collection.toObject({ virtuals: true, getters: true }),
            _id: new mongoose.Types.ObjectId(),
              name: item.collection?.name || 'Unnamed Collection',
            mainCharacterId: item.collection?.mainCharacterId || item.collection?.heroes?.[0] || 0
          };
          const charCountMap = new Map();
          for (const charId of collection.heroes) {
            const id = Number(charId);
            charCountMap.set(id, (charCountMap.get(id) || 0) + 1);
          }  
          for (const [charId, count] of charCountMap) {
            const { char, index } = charMap.get(charId);
            char.quantity -= count;
            if (char.quantity === 0) {
              fromUser.purchasedCharacters.splice(index, 1);
              charMap.delete(charId);
            }
            const toCharIndex = toUser.purchasedCharacters.findIndex(
              c => Number(c.characterId) === charId
            );
            if (toCharIndex !== -1) {
              toUser.purchasedCharacters[toCharIndex].quantity += count;
            } else {
              toUser.purchasedCharacters.push({
                characterId: charId,
                quantity: count
              });
            }
          }
          toUser.inventory.push(newCollection);
        }
      }
    }
  return processedItems;
}
/**
 * @swagger
 * /trades/marketplace:
 *   post:
 *     summary: Create a new marketplace trade offer
 *     tags: [Trades]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Trade offer data
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - offeredItems
 *               - requestedItems
 *             properties:
 *               offeredItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   required:
 *                     - type
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [character, coins, collection]
 *                     characterId:
 *                       type: integer
 *                       description: Required if type is "character"
 *                     quantity:
 *                       type: integer
 *                       description: Quantity of characters (default 1)
 *                     coins:
 *                       type: integer
 *                       description: Number of coins (if type is "coins")
 *                     collectionId:
 *                       type: string
 *                       description: Collection ID (if type is "collection")
 *               requestedItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [character, coins, collection]
 *                     characterId:
 *                       type: integer
 *                     quantity:
 *                       type: integer
 *                     coins:
 *                       type: integer
 *                     collectionId:
 *                       type: string
 *     responses:
 *       201:
 *         description: Trade created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trade'
 *       400:
 *         description: Invalid input or insufficient resources
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.post('/marketplace', authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction(); 
  try {
    const { offeredItems, requestedItems } = req.body;
    const validTypes = new Set(['character', 'coins', 'collection']);
    const validateItems = (items) => items.every(item => 
      validTypes.has(item.type) && 
      (item.type !== 'coins' || item.coins > 0) &&
      (item.type !== 'character' || item.characterId) &&
      (item.type !== 'collection' || item.collectionId)
    );
    if (!validateItems(offeredItems) || !validateItems(requestedItems)) {
      return res.status(400).json({ error: 'Invalid trade items' });
    }
    const user = await User.findById(req.user.userId)
      .select('purchasedCharacters coins inventory')
      .populate('inventory')
      .session(session);
    const processedOfferedItems = await processTradeItems(user, offeredItems, session);

    await user.save({ session });

    const trade = await Trade.create([{
      initiator: req.user.userId,
      recipient: null,
      offeredItems: processedOfferedItems,
      requestedItems: requestedItems,
      status: 'available'
    }], { session });

    await session.commitTransaction();
    res.status(201).json(trade[0]);
  } catch (error) {
    await session.abortTransaction();
    console.error('Trade creation error:', error);
    res.status(400).json({ error: error.message });
  } finally {
    session.endSession();
  }
});
/**
 * @swagger
 * /trades/marketplace:
 *   get:
 *     summary: Get available marketplace trades with optional filters
 *     tags: [Trades]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: dateRange
 *         schema:
 *           type: string
 *           enum: [24h, week]
 *         description: Filter trades by creation date
 *       - in: query
 *         name: username
 *         schema:
 *           type: string
 *         description: Filter trades by initiator username (partial match)
 *       - in: query
 *         name: minValue
 *         schema:
 *           type: integer
 *         description: Minimum trade value to filter
 *       - in: query
 *         name: maxValue
 *         schema:
 *           type: integer
 *         description: Maximum trade value to filter
 *       - in: query
 *         name: tradeType
 *         schema:
 *           type: string
 *           enum: [character, collection, mixed, all]
 *         description: Filter trades by offered items type
 *     responses:
 *       200:
 *         description: List of trades
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Trade'
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/marketplace', async (req, res) => {
    try {
      const {
        dateRange,
        username,
        minValue,
        maxValue,
        tradeType
      } = req.query;
      const query = { status: 'available' };
      if (dateRange === '24h') {
        query.createdAt = { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) };
      } else if (dateRange === 'week') {
        query.createdAt = { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) };
      }
  
      if (username) {
        const matchingUsers = await User.find({
          name: { $regex: username, $options: 'i' }
        }).select('_id');
        if (matchingUsers.length === 0) return res.json([]);
        
        const userIds = matchingUsers.map(u => u._id);
        query.initiator = { $in: userIds };
      }
  
      const trades = await Trade.find(query)
        .populate('initiator', 'name avatar')
        .sort({ createdAt: -1 })
        .lean();
      const calculateTradeValue = (items = []) => {
        return items.reduce((total, item) => {
          if (item.type === 'character') return total + 150;
          if (item.type === 'coins') return total + (item.coins || 0);
          if (item.type === 'collection') return total + ((item.collection?.heroes?.length || 0) * 50);
          return total;
        }, 0);
      };
      const filteredTrades = trades.filter(trade => {
        const offeredItems = trade.offeredItems || [];
        const hasOnlyCharacters = offeredItems.length > 0 && 
          offeredItems.every(item => item.type === 'character');
        const hasOnlyCollections = offeredItems.length > 0 && 
          offeredItems.every(item => item.type === 'collection');
        const hasMixedTypes = offeredItems.some(item => item.type === 'character') && 
          offeredItems.some(item => item.type === 'collection');
  
        if (tradeType === 'character') {
          if (!hasOnlyCharacters) return false;
        } else if (tradeType === 'collection') {
          if (!hasOnlyCollections) return false;
        } else if (tradeType === 'mixed') {
          if (!hasMixedTypes) return false;
        }
  

        const tradeValue = calculateTradeValue(offeredItems);
        if (minValue !== undefined && tradeValue < minValue) return false;
        if (maxValue !== undefined && tradeValue > maxValue) return false;
  
        return true;
      });
  
      return res.json(filteredTrades);
    } catch (error) {
      console.error('Error in /marketplace:', error);
      return res.status(500).json({ error: 'Server error' });
    }
  });
  
  
async function addItemsToUser(user, items) {
  for (const item of items) {
    if (item.type === 'character') {
      const characterId = Number(item.characterId);
      const existingCharIndex = user.purchasedCharacters.findIndex(
        c => Number(c.characterId) === characterId
      );
      
      if (existingCharIndex !== -1) {
        user.purchasedCharacters[existingCharIndex].quantity += item.quantity || 1;
      } else {
        user.purchasedCharacters.push({
          characterId: characterId,
          quantity: item.quantity || 1
        });
      }
    } 
    else if (item.type === 'coins') {
      user.coins += item.coins;
    }
    else if (item.type === 'collection') {
      const heroes = (item.collection.heroes || []).map(id => Number(id));

 const newCollection = {
    ...item.collection,
    _id: new mongoose.Types.ObjectId(),
    name: item.collection?.name || 'Unnamed Collection',
    mainCharacterId: item.collection?.mainCharacterId || heroes[0] || 0,
    heroes: heroes  
  };
  
  user.inventory.push(newCollection);

      if (item.collection.heroes && Array.isArray(item.collection.heroes)) {
        for (const charId of item.collection.heroes) {
          const characterId = Number(charId);
          const existingCharIndex = user.purchasedCharacters.findIndex(
            c => Number(c.characterId) === characterId
          );
          
          if (existingCharIndex !== -1) {
            user.purchasedCharacters[existingCharIndex].quantity += 1;
          } else {
            user.purchasedCharacters.push({
              characterId: characterId,
              quantity: 1
            });
          }
        }
      }
    }
  }
}
async function fetchCollectionDetails(collectionId) {
    try {
      const user = await User.findOne({ 'inventory._id': collectionId });
      if (user) {
        const collection = user.inventory.id(collectionId);
        if (collection) {
          return collection.toObject();
        }
      }

      const trade = await Trade.findOne({
        $or: [
          { 'offeredItems.collection._id': collectionId },
          { 'requestedItems.collection._id': collectionId }
        ]
      });
      
      if (trade) {
        const allItems = [...trade.offeredItems, ...trade.requestedItems];
        const collectionItem = allItems.find(
          item => item.type === 'collection' && 
                  item.collection?._id?.toString() === collectionId
        );
        return collectionItem?.collection;
      }
      
      return null;
    } catch (error) {
      console.error('Collection fetch error:', error);
      return null;
    }
  }
  
async function transferRequestedItems(fromUser, toUser, items, session) {
    const charMap = new Map();
    fromUser.purchasedCharacters.forEach((char, index) => {
      charMap.set(Number(char.characterId), { char, index });
    });

    for (const item of items) {
        if (item.type === 'character') {
          const charId = Number(item.characterId);
          const charData = charMap.get(charId);
          
          if (!charData) {
            throw new Error(`Character ${charId} not found in sender's inventory`);
          }
          const excludeIds = new Set(
            items
              .filter(i => i.type === 'collection' && i.collectionId)
              .map(i => i.collectionId.toString())
          );
          
          const lockedCount = countLockedCharacters(fromUser, charId, excludeIds);
          const availableQty = charData.char.quantity - lockedCount;
          const requiredQty = item.quantity || 1;
          if (availableQty < requiredQty) {
            throw new Error(
              `Insufficient available characters for ID ${charId}. ` +
              `Available: ${availableQty} (Owned: ${charData.char.quantity}, ` +
              `Locked: ${lockedCount})`
            );
          }
        } 
        else if (item.type === 'coins') {
          if (fromUser.coins < item.coins) {
            throw new Error(
              `Insufficient coins. Required: ${item.coins}, Available: ${fromUser.coins}`
            );
          }
        } 
        else if (item.type === 'collection') {
          const collection = fromUser.inventory.find(
            c => c._id.toString() === item.collectionId
          );
      
          if (!collection) {
            throw new Error(`Collection ${item.collectionId} not found`);
          }
          const charCountMap = new Map();
          for (const charId of collection.heroes) {
            const id = Number(charId);
            charCountMap.set(id, (charCountMap.get(id) || 0) + 1);
          }
          const excludeIds = new Set(
            items
              .filter(i => i.type === 'collection' && i.collectionId)
              .map(i => i.collectionId.toString())
          );
          excludeIds.add(item.collectionId.toString());
          for (const [charId, required] of charCountMap) {
            const charData = charMap.get(charId);
      
            if (!charData) {
              throw new Error(`Character ${charId} in collection not found`);
            }
      
            const lockedCount = countLockedCharacters(fromUser, charId, excludeIds);
            const availableQty = charData.char.quantity - lockedCount;
      
            if (availableQty < required) {
              throw new Error(
                `Insufficient available characters for ${charId} in collection. ` +
                `Required: ${required}, Available: ${availableQty} ` +
                `(Owned: ${charData.char.quantity}, Locked: ${lockedCount})`
              );
            }
          }
        }
      }

    for (const item of items) {
      if (item.type === 'character') {
        const charId = Number(item.characterId);
        const { char, index } = charMap.get(charId);
        const transferQty = item.quantity || 1;

        char.quantity -= transferQty;
        if (char.quantity === 0) {
          fromUser.purchasedCharacters.splice(index, 1);

          charMap.delete(charId);
        }

        const toCharIndex = toUser.purchasedCharacters.findIndex(
          c => Number(c.characterId) === charId
        );
        
        if (toCharIndex !== -1) {
          toUser.purchasedCharacters[toCharIndex].quantity += transferQty;
        } else {
          toUser.purchasedCharacters.push({
            characterId: charId,
            quantity: transferQty
          });
        }
      } 
      else if (item.type === 'coins') {
        fromUser.coins -= item.coins;
        toUser.coins += item.coins;
      } 
      else if (item.type === 'collection') {
        const collectionIndex = fromUser.inventory.findIndex(
          c => c._id.toString() === item.collectionId
        );
        
        if (collectionIndex !== -1) {
          const [collection] = fromUser.inventory.splice(collectionIndex, 1);

          const newCollection = {
            ...collection.toObject({ virtuals: true, getters: true }),
            _id: new mongoose.Types.ObjectId(),
  name: item.collection?.name || 'Unnamed Collection',
  mainCharacterId: item.collection?.mainCharacterId || item.collection?.heroes?.[0] || 0
};

          const charCountMap = new Map();
          for (const charId of collection.heroes) {
            const id = Number(charId);
            charCountMap.set(id, (charCountMap.get(id) || 0) + 1);
          }

          for (const [charId, count] of charCountMap) {
            const { char, index } = charMap.get(charId);

            char.quantity -= count;
            if (char.quantity === 0) {
              fromUser.purchasedCharacters.splice(index, 1);
              charMap.delete(charId);
            }

            const toCharIndex = toUser.purchasedCharacters.findIndex(
              c => Number(c.characterId) === charId
            );

            if (toCharIndex !== -1) {
              toUser.purchasedCharacters[toCharIndex].quantity += count;
            } else {
              toUser.purchasedCharacters.push({
                characterId: charId,
                quantity: count
              });
            }
          }

          toUser.inventory.push(newCollection);
        }
      }
    }
  }
/**
 * @swagger
 * /:id/accept:
 *   post:
 *     summary: Accept a trade by ID
 *     tags:
 *       - Trades
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: Trade ID to accept
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trade accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trade'
 *       400:
 *         description: Bad request, trade cannot be accepted or invalid conditions
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       403:
 *         description: Not authorized to accept this trade
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Trade or User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */

router.post('/:id/accept', authMiddleware, async (req, res) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const trade = await Trade.findById(req.params.id).session(session);

    if (!trade) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'Trade not found' });
    }
    if (trade.status === 'pending') {
        if (trade.recipient.toString() !== req.user.userId) {
          return res.status(403).json({ error: 'Not authorized to accept this trade' });
        }
      }
    if (trade.status !== 'available' && trade.status !== 'pending') {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Trade is not available for acceptance' });
    }

    if (trade.initiator.toString() === req.user.userId) {
      await session.abortTransaction();
      return res.status(400).json({ error: 'Cannot accept your own trade' });
    }

    const initiator = await User.findById(trade.initiator)
      .select('purchasedCharacters coins inventory')
      .session(session);
    const recipient = await User.findById(req.user.userId)
      .select('purchasedCharacters coins inventory')
      .session(session);

    if (!initiator || !recipient) {
      await session.abortTransaction();
      return res.status(404).json({ error: 'User not found' });
    }

    try {

      const convertItems = (items) => items.map(item => {
        const plainItem = item.toObject ? item.toObject() : {...item};

        if (plainItem.type === 'character' && plainItem.characterId) {
          plainItem.characterId = Number(plainItem.characterId);
        }
        
        return plainItem;
      });

      const requestedItems = convertItems(trade.requestedItems);
      const offeredItems = convertItems(trade.offeredItems);

      await transferRequestedItems(recipient, initiator, requestedItems, session);

      await addItemsToUser(recipient, offeredItems);

      await initiator.save({ session });
      await recipient.save({ session });

      trade.recipient = req.user.userId;
      trade.status = 'completed';
      trade.updatedAt = new Date();
      await trade.save({ session });
      await session.commitTransaction();
      return res.json(trade);
    } catch (error) {
      await session.abortTransaction();
      console.error('Trade transfer error:', error.message);
      return res.status(400).json({ error: error.message });
    }
  } catch (error) {
    await session.abortTransaction();
    console.error('Trade acceptance error:', error);
    res.status(500).json({ error: 'Server error' });
  } finally {
    session.endSession();
  }
});
/**
 * @swagger
 * /:id/accept:
 *   post:
 *     summary: Accept a trade by its ID
 *     tags:
 *       - Trades
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Trade ID to accept
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Trade accepted successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trade'
 *       400:
 *         description: Bad request (e.g., trade not available, cannot accept own trade)
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       403:
 *         description: Not authorized to accept this trade
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Trade or user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.get('/collections/:id', async (req, res) => {
  try {
    const collectionId = req.params.id;
    const user = await User.findOne({ 'inventory._id': collectionId });
    if (user) {
      const collection = user.inventory.id(collectionId);
      if (collection) {
        return res.json({
          ...collection.toObject(),
          _id: collection._id.toString()
        });
      }
    }
    const trade = await Trade.findOne({
      $or: [
        { 'offeredItems.collection._id': collectionId },
        { 'requestedItems.collection._id': collectionId }
      ]
    });
    if (trade) {
      const allItems = [...trade.offeredItems, ...trade.requestedItems];
      const collectionItem = allItems.find(
        item => item.type === 'collection' && 
                item.collection?._id?.toString() === collectionId
      );
      if (collectionItem && collectionItem.collection) {
        return res.json({
          ...collectionItem.collection.toObject(),
          _id: collectionId
        });
      }
    }

    return res.status(404).json({ error: 'Collection not found' });
  } catch (error) {
    console.error('Collection fetch error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
/**
 * @swagger
 * /collections/{id}:
 *   get:
 *     summary: Get collection details by ID
 *     tags:
 *       - Collections
 *     parameters:
 *       - name: id
 *         in: path
 *         description: Collection ID to retrieve
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Collection found and returned
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 items:
 *                   type: array
 *                   items:
 *                     type: object
 *       404:
 *         description: Collection not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.post('/friend', authMiddleware, async (req, res) => {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const { offeredItems, requestedItems, friendId } = req.body;
      const friend = await User.findById(friendId).session(session);
      if (!friend) {
        return res.status(404).json({ error: 'Friend not found' });
      }

      const validTypes = new Set(['character', 'coins', 'collection']);
      const validateItems = (items) => items.every(item => 
        validTypes.has(item.type) && 
        (item.type !== 'coins' || item.coins > 0) &&
        (item.type !== 'character' || item.characterId) &&
        (item.type !== 'collection' || item.collectionId)
      );
  
      if (!validateItems(offeredItems) || !validateItems(requestedItems)) {
        return res.status(400).json({ error: 'Invalid trade items' });
      }
      const user = await User.findById(req.user.userId)
        .select('purchasedCharacters coins inventory')
        .populate('inventory')
        .session(session);
  
      const processedOfferedItems = await processTradeItems(user, offeredItems, session);

      const processedRequestedItems = await Promise.all(requestedItems.map(async (item) => {
        if (item.type === 'collection') {
          const collectionDetails = await fetchCollectionDetails(item.collectionId);
          return {
            ...item,
            collection: collectionDetails || null
          };
        }
        return item;
      }));

      await user.save({ session });
      const trade = await Trade.create([{
        initiator: req.user.userId,
        recipient: friendId,
        offeredItems: processedOfferedItems,
        requestedItems: processedRequestedItems, 
        status: 'pending'
      }], { session });
  
      await session.commitTransaction();
      res.status(201).json(trade[0]);
    } catch (error) {
      await session.abortTransaction();
      console.error('Friend trade creation error:', error);
      res.status(400).json({ error: error.message });
    } finally {
      session.endSession();
    }
  });
/**
 * @swagger
 * /friend:
 *   post:
 *     summary: Create a trade with a friend
 *     tags:
 *       - Trades
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       description: Trade data including offered items, requested items, and friend ID
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - offeredItems
 *               - requestedItems
 *               - friendId
 *             properties:
 *               offeredItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [character, coins, collection]
 *                     characterId:
 *                       type: integer
 *                       nullable: true
 *                     coins:
 *                       type: integer
 *                       nullable: true
 *                     collectionId:
 *                       type: string
 *                       nullable: true
 *               requestedItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [character, coins, collection]
 *                     characterId:
 *                       type: integer
 *                       nullable: true
 *                     coins:
 *                       type: integer
 *                       nullable: true
 *                     collectionId:
 *                       type: string
 *                       nullable: true
 *               friendId:
 *                 type: string
 *                 description: User ID of the friend to trade with
 *     responses:
 *       201:
 *         description: Trade created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trade'
 *       400:
 *         description: Invalid trade items or bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Friend user not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 */
  router.get('/user', authMiddleware, async (req, res) => {
    try {
      const userId = req.user.userId;
      
      const trades = await Trade.find({
        $or: [
          { initiator: userId },
          { recipient: userId },
          { status: 'available' }
        ]
      })
      .populate('initiator', 'name avatar')
      .populate('recipient', 'name avatar')
      .lean() 
      .sort('-createdAt');

      const enrichedTrades = await Promise.all(trades.map(async trade => {
        const enrichItems = async items => {
          return Promise.all(items.map(async item => {
            if (item.type === 'collection' && item.collectionId) {
              const collectionDetails = await fetchCollectionDetails(item.collectionId);
              return { 
                ...item, 
                collection: collectionDetails || null 
              };
            }
            return item;
          }));
        };
  
        return {
          ...trade,
          offeredItems: await enrichItems(trade.offeredItems),
          requestedItems: await enrichItems(trade.requestedItems)
        };
      }));
  
      res.json(enrichedTrades);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
/**
 * @swagger
 * /:id/:action:
 *   post:
 *     summary: Perform an action (accept, reject, cancel) on a trade by ID
 *     tags:
 *       - Trades
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Trade ID
 *       - in: path
 *         name: action
 *         required: true
 *         schema:
 *           type: string
 *           enum: [accept, reject, cancel]
 *         description: Action to perform on the trade
 *     responses:
 *       200:
 *         description: Trade updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Trade'
 *       400:
 *         description: Invalid action or bad request
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       403:
 *         description: Not authorized to perform action
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       404:
 *         description: Trade or User not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *       500:
 *         description: Server error
 */
router.post('/:id/:action', authMiddleware, async (req, res) => {
  const { id, action } = req.params;
  const validActions = ['accept', 'reject', 'cancel'];
  if (!validActions.includes(action)) {
      return res.status(400).json({ error: 'Invalid action' });
  }
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
      const trade = await Trade.findById(id).session(session);
      if (!trade) {
          await session.abortTransaction();
          return res.status(404).json({ error: 'Trade not found' });
      }

      const userId = req.user.userId;
      
      if (action === 'accept' || action === 'reject') {
          if (!trade.recipient || trade.recipient.toString() !== userId) {
              await session.abortTransaction();
              return res.status(403).json({ error: 'Not authorized' });
          }
      }

    const shouldReturnToInitiator = 
      (action === 'cancel' && trade.initiator.toString() === userId) || 
      (action === 'reject' && trade.recipient.toString() === userId);

    if (shouldReturnToInitiator) {
      const initiator = await User.findById(trade.initiator)
        .select('purchasedCharacters coins inventory')
        .session(session);

      if (!initiator) {
        await session.abortTransaction();
        return res.status(404).json({ error: 'User not found' });
      }

  for (const item of trade.offeredItems) {
    if (item.type === 'character') {
      const charIndex = initiator.purchasedCharacters.findIndex(
        c => Number(c.characterId) === Number(item.characterId)
      );

      if (charIndex !== -1) {
        initiator.purchasedCharacters[charIndex].quantity += item.quantity || 1;
      } else {
        initiator.purchasedCharacters.push({
          characterId: Number(item.characterId),
          quantity: item.quantity || 1
        });
      }
    } 
    else if (item.type === 'coins') {
      initiator.coins += item.coins;
    }
    else if (item.type === 'collection') {
const newCollection = {
  ...item.collection,
  _id: new mongoose.Types.ObjectId(),
  name: item.collection?.name || 'Unnamed Collection',
  mainCharacterId: item.collection?.mainCharacterId || item.collection?.heroes?.[0] || 0
};
      initiator.inventory.push(newCollection);

      for (const charId of item.collection.heroes) {
        const characterId = Number(charId);
        const charIndex = initiator.purchasedCharacters.findIndex(
          c => Number(c.characterId) === characterId
        );

        if (charIndex !== -1) {
          initiator.purchasedCharacters[charIndex].quantity += 1;
        } else {
          initiator.purchasedCharacters.push({
            characterId: characterId,
            quantity: 1
          });
        }
      }
    }
  }

      await initiator.save({ session });
}

      const statusMap = {
          accept: 'accepted',
          reject: 'rejected',
          cancel: 'canceled'
      };

      trade.status = statusMap[action];
      trade.updatedAt = new Date();

      if (trade.status === 'canceled' && !trade.recipient) {
          trade.recipient = null;
      }
      
      await trade.save({ session });
      await session.commitTransaction();
      
      res.json(trade);
  } catch (error) {
      await session.abortTransaction();
      console.error('Trade action error:', error.message, error.stack);
      res.status(400).json({ 
          error: error.message
      });
  } finally {
      session.endSession();
  }
});
/**
 * @swagger
 * /trading-analytics:
 *   get:
 *     summary: Retrieve trading analytics data
 *     tags:
 *       - Trades
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Trading analytics data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 stats:
 *                   type: object
 *                   properties:
 *                     tradesCount:
 *                       type: integer
 *                       description: Number of available trades
 *                     completedTrades:
 *                       type: integer
 *                       description: Number of completed trades
 *                     activeUsers:
 *                       type: integer
 *                       description: Number of active users with available trades
 *                     avgValue:
 *                       type: number
 *                       description: Average trade value
 *                     maxValue:
 *                       type: number
 *                       description: Maximum trade value
 *                     minValue:
 *                       type: number
 *                       description: Minimum trade value
 *                 peakHours:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       hour:
 *                         type: string
 *                         description: Hour of day (0-23)
 *                       count:
 *                         type: integer
 *                         description: Number of trades created in this hour
 *                 popularCharacters:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         description: Character ID
 *                       name:
 *                         type: string
 *                         description: Character name
 *                       count:
 *                         type: integer
 *                         description: Number of trades offering this character
 *                 tradeActivity:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         description: Date string (YYYY-MM-DD)
 *                       trades:
 *                         type: integer
 *                         description: Number of trades on that date
 *                 topPartners:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: Partner user name
 *                       avatar:
 *                         type: string
 *                         description: Partner user avatar URL
 *                       trades:
 *                         type: integer
 *                         description: Number of trades with this partner
 *                       lastTrade:
 *                         type: string
 *                         format: date-time
 *                         description: Date of last trade with this partner
 *                 popularCollections:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       name:
 *                         type: string
 *                         description: Collection name
 *                       count:
 *                         type: integer
 *                         description: Number of trades offering this collection
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 */
router.get('/trading-analytics', authMiddleware, async (req, res) => {
    try {
      const today = new Date();
      const lastWeek = new Date();
      lastWeek.setDate(today.getDate() - 7);
      
      const stats = {
        tradesCount: await Trade.countDocuments({ status: 'available' }),
        completedTrades: await Trade.countDocuments({ status: 'completed' }),
        activeUsers: await Trade.distinct('initiator', { status: 'available' }).countDocuments()
      };
      const valueStats = await Trade.aggregate([
        { $match: { status: 'available' } },
        { $project: {
            value: {
              $sum: {
                $map: {
                  input: "$offeredItems",
                  as: "item",
                  in: {
                    $switch: {
                      branches: [
                        { 
                          case: { $eq: ["$$item.type", "character"] },
                          then: 150 
                        },
                        { 
                          case: { $eq: ["$$item.type", "coins"] },
                          then: "$$item.coins"
                        },
                        { 
                          case: { 
                            $and: [
                              { $eq: ["$$item.type", "collection"] },
                              { $ifNull: ["$$item.collection.heroes", false] }
                            ] 
                          },
                          then: { $multiply: [ { $size: { $ifNull: ["$$item.collection.heroes", []] } }, 50 ] }
                        }
                      ],
                      default: 0
                    }
                  }
                }
              }
            }
          }
        },
        { $group: {
            _id: null,
            avgValue: { $avg: "$value" },
            maxValue: { $max: "$value" },
            minValue: { $min: "$value" }
          }
        }
      ]);
      const peakHours = await Trade.aggregate([
        { $match: { status: 'available' } },
        { $project: { hour: { $hour: "$createdAt" } } },
        { $group: { 
            _id: "$hour", 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { count: -1 } },
        { $limit: 8 },
        { $project: {
            hour: { $toString: "$_id" },
            count: 1,
            _id: 0
          }
        }
      ]);

      const popularCharacters = await Trade.aggregate([
        { $match: { 
            status: 'available',
            "offeredItems.type": "character",
            "offeredItems.characterId": { $ne: null }
          } 
        },
        { $unwind: "$offeredItems" },
        { $match: { 
            "offeredItems.type": "character",
            "offeredItems.characterId": { $ne: null }
          } 
        },
        { $group: { 
            _id: "$offeredItems.characterId", 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { count: -1 } },
        { $limit: 10 },
        { $project: {
            id: { $ifNull: ["$_id", 0] },
            name: { 
              $concat: [
                "Character ", 
                { $toString: { $ifNull: ["$_id", "0"] } } 
              ] 
            },
            count: 1,
            _id: 0
          }
        }
      ]);
  
      const tradeActivity = await Trade.aggregate([
        { $match: { 
            status: 'available',
            createdAt: { $gte: lastWeek } 
          } 
        },
        { $project: { 
            day: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } } 
          } 
        },
        { $group: { 
            _id: "$day", 
            trades: { $sum: 1 } 
          } 
        },
        { $sort: { _id: 1 } }
      ]);

      const userId = new mongoose.Types.ObjectId(req.user.userId);
      const topPartners = await Trade.aggregate([
        { $match: { 
            status: 'completed',
            $or: [
              { initiator: userId },
              { recipient: userId }
            ]
          } 
        },
        { $project: {
            partner: {
              $cond: {
                if: { $eq: ["$initiator", userId] },
                then: "$recipient",
                else: "$initiator"
              }
            },
            createdAt: 1
          }
        },
        { $match: { partner: { $ne: null } } },
        { $group: {
            _id: "$partner",
            count: { $sum: 1 },
            lastTrade: { $max: "$createdAt" }
          }
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: {
            from: "users",
            localField: "_id",
            foreignField: "_id",
            as: "user"
          }
        },
        { $unwind: "$user" },
        { $project: {
            name: "$user.name",
            avatar: "$user.avatar",
            trades: "$count",
            lastTrade: 1
          }
        }
      ]);
      const popularCollections = await Trade.aggregate([
        { $match: { 
            status: 'available',
            "offeredItems.type": "collection",
            "offeredItems.collection.name": { $exists: true }
          } 
        },
        { $unwind: "$offeredItems" },
        { $match: { 
            "offeredItems.type": "collection",
            "offeredItems.collection.name": { $exists: true }
          } 
        },
        { $group: { 
            _id: "$offeredItems.collection.name", 
            count: { $sum: 1 } 
          } 
        },
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $project: {
            name: "$_id",
            count: 1,
            _id: 0
          }
        }
      ]);
      res.json({
        stats: {
          ...stats,
          avgValue: valueStats[0]?.avgValue || 0,
          maxValue: valueStats[0]?.maxValue || 0,
          minValue: valueStats[0]?.minValue || 0
        },
        peakHours,
        popularCharacters,
        tradeActivity,
        topPartners,
        popularCollections
      });
    } catch (error) {
      console.error('Error fetching trade analytics:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });





  
module.exports = router;