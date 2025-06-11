const express = require('express');
const router = express.Router();
const crypto = require('crypto');
const MarvelFigure = require('../models/MarvelFigure');
const { setTimeout: delay } = require('timers/promises');
/**
 * @swagger
 * tags:
 *   name: Marvel
 *   description: API endpoints for Marvel character data and figure customization
 */
const API_KEYS = [
  {
    publicKey: 'd224496d0b07a9b7d970423565a65370',
    privateKey: '7ff6180a3e2fbb6633170c96c90c8662c13c5298'
  },
  {
    publicKey: '6b80a044d5fe49d81eb73e0378181739',
    privateKey: '555f97f0ada1cea2262d4e42749b6d3d56a17875'
  },
  {
    publicKey: 'c557607bf7b8db5e23a694bd9c817400',
    privateKey: 'b3e46b03f5debae04704159d1464852bb7e1943e'
  },
  {
    publicKey: 'd4cad1134d311b253125dd96f90c369d',
    privateKey: 'ed312cd631a9e602778716f392e01bcdcefef1ff'
  },
  {
    publicKey: '46bf5111c44f4bb275482f085b9fefa7',
    privateKey: '6910a4bd9cb4a7bc3ba8210b170151cd5f529026'
  },
  {
    publicKey: 'a01470737ced007368381454049c06ac',
    privateKey: '8a4f77b2620ab243a6364ab085e861df7da56cd0'
  },
  {
    publicKey: '134917ee86587c16c3ebd90f6c0e33fb',
    privateKey: '12589e796ae434d4df1058e587e646143401c801'
  },
  {
    publicKey: 'c09ee65210cbe6b427b93c83737690ef',
    privateKey: 'cbb68c841c691daa0bb93262962d19d6cfe570e2'
  },
  {
    publicKey: '138acdaaa628e4b3a1489f78de29bf3b',
    privateKey: '571a292660cd035426de4ddbe251c7bb8fe76f47'
  },
  {
    publicKey:'1d790bacf309a08969becd1094b57052',
    privateKey:'c48041a641577bee1957a11d0181a49fbcdac375'
  },
  {
  publicKey:'4734774af1698b009e00ba66009fb562',
  privateKey:'f1017e2abe73a7889cdaf42368d7cf50a8a20f19'
  },
  {
    publicKey:'66f93042e37f5970b38cad6dc96f6cda',
    privateKey:'0751b4260781fcad0f918a64d917a68ce071a2b5'
  },
  {
  publicKey:'594d21aaaba0c46e3043e0e043e6bb3c',
  privateKey:'9076efd2afa7649903337cff3aa8ca394117c5fd'
  },
  {
    publicKey: 'b7be484f4ba1576abd6d16b62af3cef4',
    privateKey:'b31e6904703b82618e98be55819f1de56b9a97ac'
  },
  {
    publicKey:'2bc597b4d161c415005c22d987425c42',
    privateKey:'f55cee41d39cc4069a6fc74699f0fbbd33c10620'
  }
];
const LIMIT = 100;
const CONCURRENCY = 5;
const RETRY_DELAY = 1000;
const RATE_LIMIT_DELAY = 2000; 
let currentKeyIndex = 0;
let keyUsageCount = 0;
const MAX_USES_PER_KEY = 1000; 

const generateHash = (ts, privateKey, publicKey) => {
  return crypto.createHash('md5')
    .update(ts + privateKey + publicKey)
    .digest('hex');
};

const rotateKey = () => {
  currentKeyIndex = (currentKeyIndex + 1) % API_KEYS.length;
  keyUsageCount = 0;
  console.log(`Rotated to API key index: ${currentKeyIndex}`);
};

const getCurrentKeys = () => {
  return API_KEYS[currentKeyIndex];
};

const marvelApiRequest = async (url, retries = 3) => {
  let attempt = 0;
  
  while (attempt < retries) {
    attempt++;
    const { publicKey, privateKey } = getCurrentKeys();
    const ts = Date.now().toString();
    const hash = generateHash(ts, privateKey, publicKey);
    const apiUrl = new URL(url);
    apiUrl.searchParams.append('ts', ts);
    apiUrl.searchParams.append('apikey', publicKey);
    apiUrl.searchParams.append('hash', hash);
    try {
      const response = await fetch(apiUrl.toString());
      keyUsageCount++;
      if (keyUsageCount >= MAX_USES_PER_KEY) {
        rotateKey();
      }
      if (response.status === 429) {
        console.warn(`Rate limit exceeded on key ${currentKeyIndex}`);
        rotateKey();
        await delay(RATE_LIMIT_DELAY);
        continue;
      }
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error(`API request failed (attempt ${attempt}):`, error.message);
      if (attempt < retries) {
        if (error.message.includes('429') || error.message.includes('50')) {
          rotateKey();
        }
        await delay(RETRY_DELAY * attempt);
      } else {
        throw error;
      }
    }
  }
};

const fetchAllCharacterIds = async () => {
  try {
    const initData = await marvelApiRequest(
      'https://gateway.marvel.com/v1/public/characters?limit=1'
    );
    const total = initData.data.total;
    console.log(`Total characters: ${total}`);
    const offsets = Array.from({ length: Math.ceil(total / LIMIT) }, (_, i) => i * LIMIT);
    const fetchPage = async (offset) => {
      const data = await marvelApiRequest(
        `https://gateway.marvel.com/v1/public/characters?limit=${LIMIT}&offset=${offset}`
      );
      return data.data.results.map(c => c.id);
    };
    const allIds = [];
    while (offsets.length > 0) {
      const chunk = offsets.splice(0, CONCURRENCY);
      const results = await Promise.allSettled(chunk.map(fetchPage));
      for (const result of results) {
        if (result.status === 'fulfilled') {
          allIds.push(...result.value);
        } else {
          console.error('Page fetch failed:', result.reason);
        }
      }
      console.log(`Get ${allIds.length} IDs (total target: ${total})`);
    }
    if (allIds.length !== total) {
      console.warn(`Warning: Total API (${total}) ≠ Extracted IDs (${allIds.length})`);
    }
    return allIds;
  } catch (error) {
    console.error('Error extracting IDs:', error.message);
    throw error;
  }
};
/**
 * @swagger
 * /characters:
 *   get:
 *     summary: Get all Marvel character IDs
 *     tags: [Marvel]
 *     responses:
 *       200:
 *         description: A list of character IDs with count and timestamp
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 count:
 *                   type: integer
 *                 ids:
 *                   type: array
 *                   items:
 *                     type: integer
 *                 timestamp:
 *                   type: integer
 *       500:
 *         description: Failed to retrieve character IDs
 */
router.get('/characters', async (req, res) => {
  try {
    const startTime = Date.now();
    const cachedData = req.app.get('marvelCache');
    if (cachedData?.ids) {
      console.log(` Useing cache (${cachedData.ids.length} IDs)`);
      return res.json(cachedData);
    }
    console.log('Extraction IDs...');
    const ids = await fetchAllCharacterIds();
    const cacheData = {
      count: ids.length,
      ids,
      timestamp: Date.now()
    };
    req.app.set('marvelCache', cacheData);
    console.log(`🎉 Completed in ${((Date.now() - startTime)/1000)} sec`);
    res.json(cacheData);
  } catch (error) {
    res.status(500).json({
      error: 'Error retrieving IDs',
      details: error.message
    });
  }
});
const fetchCharacterDetails = async (characterId) => {
  try {
    const data = await marvelApiRequest(
      `https://gateway.marvel.com/v1/public/characters/${characterId}`
    );
    return data.data.results[0];
  } catch (error) {
    console.error(`Error at ID ${characterId}:`, error.message);
    throw error;
  }
};
/**
 * @swagger
 * /characters/{id}:
 *   get:
 *     summary: Get Marvel character details by ID
 *     tags: [Marvel]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Marvel character ID
 *     responses:
 *       200:
 *         description: Character details
 *       500:
 *         description: Failed to retrieve character data
 */
router.get('/characters/:id', async (req, res) => {
  try {
    const characterId = req.params.id;
    const cachedCharacters = req.app.get('marvelCharactersCache') || {};
    if (cachedCharacters[characterId]?.timestamp > Date.now() - 3600000) {
      return res.json(cachedCharacters[characterId].data);
    }
    const characterData = await fetchCharacterDetails(characterId);
    const newCache = {
      ...cachedCharacters,
      [characterId]: {
        data: characterData,
        timestamp: Date.now()
      }
    };
    req.app.set('marvelCharactersCache', newCache);
    res.json(characterData);
  } catch (error) {
    res.status(500).json({
      error: 'Error retrieving character data',
      details: error.message
    });
  }
});
/**
 * @swagger
 * /search:
 *   post:
 *     summary: Search Marvel characters by name
 *     tags: [Marvel]
 *     requestBody:
 *       description: Search input
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               searchTerm:
 *                 type: string
 *                 example: Spider
 *     responses:
 *       200:
 *         description: Search results
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   thumbnail:
 *                     type: object
 *                   comics:
 *                     type: object
 *                     properties:
 *                       available:
 *                         type: integer
 *       400:
 *         description: Invalid search term
 *       500:
 *         description: Search failed
 */
router.post('/search', async (req, res) => {
  try {
    const { searchTerm } = req.body;
    if (!searchTerm) {
      return res.status(400).json({
        received: searchTerm
      });
    }
    const data = await marvelApiRequest(
      `https://gateway.marvel.com/v1/public/characters?nameStartsWith=${encodeURIComponent(searchTerm.trim())}&limit=50`
    );
    const filteredResults = data.data.results.map(character => ({
      id: character.id,
      name: character.name,
      description: character.description,
      thumbnail: character.thumbnail,
      comics: { available: character.comics.available }
    }));
    res.json(filteredResults);
  } catch (error) {
    res.status(500).json({
      error: 'Search failed',
      details: error.message
    });
  }
});
/**
 * @swagger
 * /charactersdb/{id}:
 *   put:
 *     summary: Update character metadata in the local database
 *     tags: [Marvel]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Marvel character ID
 *     requestBody:
 *       description: Custom character data to save
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               price:
 *                 type: number
 *               description:
 *                 type: string
 *               rarity:
 *                 type: string
 *                 enum: [common, rare, epic, legendary]
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *               tags:
 *                 type: array
 *                 items:
 *                   type: string
 *     responses:
 *       200:
 *         description: Character data successfully updated
 *       500:
 *         description: Error saving character data
 */
router.put('/charactersdb/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { price, description, rarity, images, tags } = req.body;
    const processedImages = typeof images === 'string' 
      ? images.split(',').map(s => s.trim()).filter(Boolean)
      : Array.isArray(images) ? images.filter(Boolean) : [];
    const processedTags = typeof tags === 'string' 
      ? tags.split(',').map(t => t.trim().substring(0, 20)).filter(Boolean).slice(0, 10)
      : Array.isArray(tags) ? tags.map(t => t.substring(0, 20)).filter(Boolean).slice(0, 10)
      : [];
    const updateData = {
      marvelId: parseInt(id),
      price: Number(price) || 0,
      description: description || '',
      rarity: rarity || 'common',
      images: processedImages,
      tags: processedTags,
      updatedAt: new Date()
    };
    const result = await MarvelFigure.findOneAndUpdate(
      { marvelId: id },
      { $set: updateData },
      { 
        new: true,
        upsert: true,
        runValidators: true,
        projection: { 
          _id: 0,
          marvelId: 1,
          price: 1,
          description: 1,
          rarity: 1,
          images: 1,
          tags: 1,
          updatedAt: 1 
        }
      }
    );
    res.json({
      id: result.marvelId,
      price: result.price,
      description: result.description,
      rarity: result.rarity,
      images: result.images,
      tags: result.tags,
      updatedAt: result.updatedAt
    });
  } catch (error) {
    res.status(500).json({
      error: 'Error saving data',
      details: error.message
    });
  }
});
/**
 * @swagger
 * /charactersdb/{id}:
 *   get:
 *     summary: Get combined Marvel and database character data
 *     tags: [Marvel]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Marvel character ID
 *     responses:
 *       200:
 *         description: Combined character data
 *       500:
 *         description: Error retrieving character data
 */
router.get('/charactersdb/:id', async (req, res) => {
  try {
    const characterId = req.params.id;
    const cachedCharacters = req.app.get('marvelCharactersCache') || {};
    let characterData;
    if (cachedCharacters[characterId]?.timestamp > Date.now() - 3600000) {
      characterData = cachedCharacters[characterId].data;
    } else {
      characterData = await fetchCharacterDetails(characterId);
      const newCache = {
        ...cachedCharacters,
        [characterId]: {
          data: characterData,
          timestamp: Date.now()
        }
      };
      req.app.set('marvelCharactersCache', newCache);
    }
    const dbData = await MarvelFigure.findOne({ marvelId: characterId }) || {};
    const processedTags = Array.isArray(dbData.tags)
      ? dbData.tags
      : [];
    const combinedData = {
      ...characterData,
      price: dbData.price || 1,
      rarity: dbData.rarity || 'common',
      images: dbData.images || [],
      customDescription: dbData.description || '',
      tags: processedTags
    };
    res.json(combinedData);
  } catch (error) {
    res.status(500).json({
      error: 'Error retrieving combined data',
      details: error.message
    });
  }
});
/**
 * @swagger
 * /fulldatacharacter/{id}:
 *   get:
 *     summary: Get full data for a character by ID
 *     description: Retrieves detailed information about a Marvel character, combining data from the Marvel API cache and custom database fields.
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         description: ID of the Marvel character to retrieve
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Character data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: integer
 *                   example: 1011334
 *                 name:
 *                   type: string
 *                   example: "3-D Man"
 *                 description:
 *                   type: string
 *                   example: "A hero description."
 *                 thumbnail:
 *                   type: object
 *                   properties:
 *                     path:
 *                       type: string
 *                       example: "http://example.com/image"
 *                     extension:
 *                       type: string
 *                       example: "jpg"
 *                 comics:
 *                   type: object
 *                   description: Comics appearances info
 *                 price:
 *                   type: number
 *                   example: 1
 *                 rarity:
 *                   type: string
 *                   example: "common"
 *                 images:
 *                   type: array
 *                   items:
 *                     type: string
 *                 customDescription:
 *                   type: string
 *                 tags:
 *                   type: array
 *                   items:
 *                     type: string
 *       500:
 *         description: Error fetching character data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 details:
 *                   type: string
 */
router.get('/fulldatacharacter/:id', async (req, res) => {
  try {
    const characterId = req.params.id;
    const cachedCharacters = req.app.get('marvelCharactersCache') || {};
    let characterData;
    if (cachedCharacters[characterId]?.timestamp > Date.now() - 3600000) {
      characterData = cachedCharacters[characterId].data;
    } else {
      characterData = await fetchCharacterDetails(characterId);
      req.app.set('marvelCharactersCache', {
        ...cachedCharacters,
        [characterId]: { data: characterData, timestamp: Date.now() }
      });
    }
    const dbData = await MarvelFigure.findOne({ marvelId: characterId }).lean() || {};
    res.json({
      id: characterData.id,
      name: characterData.name,
      description: characterData.description,
      thumbnail: characterData.thumbnail,
      comics: characterData.comics,
      price: dbData.price || 1,
      rarity: dbData.rarity || 'common',
      images: dbData.images || [],
      customDescription: dbData.description || '',
      tags: Array.isArray(dbData.tags) ? dbData.tags : []
    });
  } catch (error) {
    res.status(500).json({ error: 'Error fetching character', details: error.message });
  }
});
/**
 * @swagger
 * /batch-full-data:
 *   get:
 *     summary: Get full batch data for all Marvel characters
 *     description: Retrieves all Marvel characters in batches, merging Marvel API data with custom database info. Uses caching for performance.
 *     responses:
 *       200:
 *         description: Full batch character data retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: integer
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 *                   thumbnail:
 *                     type: object
 *                     properties:
 *                       path:
 *                         type: string
 *                       extension:
 *                         type: string
 *                   comics:
 *                     type: object
 *                   series:
 *                     type: object
 *                   urls:
 *                     type: array
 *                     items:
 *                       type: object
 *                   price:
 *                     type: number
 *                   rarity:
 *                     type: string
 *                   images:
 *                     type: array
 *                     items:
 *                       type: string
 *                   tags:
 *                     type: array
 *                     items:
 *                       type: string
 *       500:
 *         description: Error fetching batch full data
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                 details:
 *                   type: string
 */
router.get('/batch-full-data', async (req, res) => {
  try {
    const startTime = Date.now();
    const cache = req.app.get('batchDataCache');
    if (cache && Date.now() - cache.timestamp < 3600000) {
      console.log('Using batch cache');
      return res.json(cache.data);
    }
    const initData = await marvelApiRequest(
      'https://gateway.marvel.com/v1/public/characters?limit=1'
    );
    const total = initData.data.total;
    const offsets = Array.from({ length: Math.ceil(total / LIMIT) }, (_, i) => i * LIMIT);
    console.log(`Starting full extraction (${total} characters)`);
    const fetchPage = async (offset) => {
      const data = await marvelApiRequest(
        `https://gateway.marvel.com/v1/public/characters?limit=${LIMIT}&offset=${offset}`
      );
      return data.data.results;
    };
    const allCharacters = [];
    while (offsets.length > 0) {
      const chunk = offsets.splice(0, CONCURRENCY);
      const results = await Promise.allSettled(chunk.map(fetchPage));
      for (const result of results) {
        if (result.status === 'fulfilled') {
          allCharacters.push(...result.value);
        } else {
          console.error('Page fetch error:', result.reason);
        }
      }
      console.log(`Extraction progress: ${allCharacters.length} characters`);
    }
    const marvelIds = allCharacters.map(c => c.id);
    const existingFigures = await MarvelFigure.find({ marvelId: { $in: marvelIds } })
      .lean()
      .select('-_id marvelId price description rarity images tags');
    const existingMap = Object.fromEntries(existingFigures.map(f => [f.marvelId, f]));
    const finalData = allCharacters.map(character => {
      const base = {
        id: character.id,
        name: character.name,
        description: character.description,
        thumbnail: character.thumbnail,
        comics: character.comics,
        series: character.series,
        urls: character.urls
      };
      const dbData = existingMap[character.id];
      const custom = {
        price: dbData?.price ?? 1,
        rarity: dbData?.rarity ?? 'common',
        description: dbData?.description ?? character.description,
        images: dbData?.images?.length ? dbData.images : [
          `${character.thumbnail.path}/portrait_uncanny.${character.thumbnail.extension}`
        ],
        tags: Array.isArray(dbData?.tags) ? dbData.tags : []
      };
      return {
        ...base,
        ...custom
      };
    });
    req.app.set('batchDataCache', {
      timestamp: Date.now(),
      data: finalData
    });
    console.log(`Batch extraction completed in ${(Date.now() - startTime) / 1000} sec`);
    res.json(finalData);
  } catch (error) {
    console.error('Full batch data error:', error);
    res.status(500).json({ error: 'Full batch data error', details: error.message });
  }
});
/**
 * @swagger
 * /comic-images:
 *   post:
 *     summary: Get images for a list of Marvel comic IDs
 *     description: Fetches only the thumbnail image URLs for provided Marvel comic IDs
 *     tags: [Marvel]
 *     requestBody:
 *       description: List of Marvel comic IDs
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 example: [65072, 65032]
 *     responses:
 *       200:
 *         description: List of image URLs indexed by comic ID
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               additionalProperties:
 *                 type: string
 *                 description: Comic ID mapped to image URL
 *       400:
 *         description: Invalid input
 *       500:
 *         description: Error fetching comic images
 */
router.post('/comic-images', async (req, res) => {
  try {
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ error: 'Invalid or empty ID list' });
    }
    const fetchComicImage = async (id) => {
      try {
        const data = await marvelApiRequest(`https://gateway.marvel.com/v1/public/comics/${id}`);
        const comic = data.data.results[0];
        return {
          id,
          imageUrl: `${comic.thumbnail.path}.${comic.thumbnail.extension}`
        };
      } catch (error) {
        console.error(`Failed to fetch comic ${id}:`, error.message);
        return { id, error: error.message };
      }
    };
    const maxConcurrency = 10;
    const results = [];
    let index = 0;
    const runNext = async () => {
      if (index >= ids.length) return null;
      const id = ids[index++];
      const result = await fetchComicImage(id);
      results.push(result);
      return runNext(); 
    };
    const workers = Array.from({ length: maxConcurrency }, () => runNext());
    await Promise.all(workers);
    const response = {};
    results.forEach(({ id, imageUrl }) => {
      if (imageUrl) response[id] = imageUrl;
    });
    res.json(response);
  } catch (error) {
    res.status(500).json({
      error: 'Error fetching comic images',
      details: error.message
    });
  }
});







module.exports = router;