const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const fs = require('fs');
const path = require('path');
const sharp = require('sharp');
const authMiddleware = require('../middleware/auth');
/**
 * @swagger
 * tags:
 *   name: Users
 *   description: User management and authentication
 */

/**
 * @swagger
 * /register:
 *   post:
 *     summary: Register a new user
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - password
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       201:
 *         description: User created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Missing required fields
 *       409:
 *         description: Email already registered
 *       500:
 *         description: Server error
 */
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'All fields are required' });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      role: 'user'
    });

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '72h' }
    );

    res.status(201).json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
/**
 * @swagger
 * /login:
 *   post:
 *     summary: Authenticate user and obtain JWT token
 *     tags: [Users]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *                 example: johndoe@example.com
 *               password:
 *                 type: string
 *                 example: password123
 *     responses:
 *       200:
 *         description: Successful authentication with token
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 token:
 *                   type: string
 *                 user:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     role:
 *                       type: string
 *       400:
 *         description: Missing email or password
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Server error
 */
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password required' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ error: 'Username or password is incorrect' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Username or password is incorrect' });
    }

    const token = jwt.sign(
      { userId: user._id },
      process.env.JWT_SECRET,
      { expiresIn: '72h' }
    );

    res.json({
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});
/**
 * @swagger
 * /me:
 *   get:
 *     summary: Get authenticated user details
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User data returned successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 email:
 *                   type: string
 *                 avatar:
 *                   type: string
 *                   nullable: true
 *                 role:
 *                   type: string
 *                 paymentMethods:
 *                   type: array
 *                   items:
 *                     type: object
 *                 billingAddress:
 *                   type: object
 *                   nullable: true
 *                 transactions:
 *                   type: array
 *                   items:
 *                     type: object
 *                 purchasedCharacters:
 *                   type: array
 *                   items:
 *                     type: object
 *                 inventory:
 *                   type: array
 *                   items:
 *                     type: object
 *                 friends:
 *                   type: array
 *                   items:
 *                     type: object
 *                 friendRequestsSent:
 *                   type: array
 *                   items:
 *                     type: object
 *                 friendRequestsReceived:
 *                   type: array
 *                   items:
 *                     type: object
 *       401:
 *         description: Unauthorized (missing or invalid token)
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const user = await User.findById(req.user.userId)
      .select('-password')
      .populate('friends', 'name avatar status gamesPlayed')
      .populate('friendRequestsSent', 'name avatar')
      .populate('friendRequestsReceived', 'name avatar')
      .lean();

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }
    const transformedInventory = (user.inventory || []).map(coll => ({
      ...coll,
      id: coll._id,
      heroes: (coll.heroes || []).map(h => h.marvelId)
    }));

    const responseData = {
      ...user,
      avatar: user.avatar || '/uploads/default-avatar.jpg',
      paymentMethods: user.paymentMethods || [],
      billingAddress: user.billingAddress || null,
      transactions: user.transactions || [],
      purchasedCharacters: user.purchasedCharacters || [],
      inventory: transformedInventory,
      friends: user.friends || [],
      friendRequestsSent: user.friendRequestsSent || [],
      friendRequestsReceived: user.friendRequestsReceived || []
    };

    res.json(responseData);
  } catch (error) {
    console.error('Error fetching user data:', error);
    res.status(500).json({ error: 'Server error loading user data' });
  }
});

  
 /**
 * @swagger
 * /update-avatar:
 *   put:
 *     summary: Update authenticated user's avatar
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - avatar
 *             properties:
 *               avatar:
 *                 type: string
 *                 description: Base64 encoded image string
 *     responses:
 *       200:
 *         description: Avatar updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 avatar:
 *                   type: string
 *                   description: URL of the updated avatar
 *       400:
 *         description: Avatar field missing
 *       500:
 *         description: Server error during avatar update
 */
router.put('/update-avatar', authMiddleware, async (req, res) => {
    try {
        const { avatar } = req.body;

        if (!avatar) {
            return res.status(400).json({ error: 'Avatar is required' });
        }

        const currentUser = await User.findById(req.user.userId);
        const oldAvatar = currentUser.avatar;

        const base64Data = avatar.replace(/^data:image\/\w+;base64,/, '');
        const binaryData = Buffer.from(base64Data, 'base64');

        const uploadPath = path.join(__dirname, '../uploads/');
        const filename = `avatar-${Date.now()}.jpg`;
        const filePath = path.join(uploadPath, filename);

        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        await sharp(binaryData)
            .resize(300, 300, { 
                fit: 'cover',
                position: sharp.strategy.entropy 
            })
            .jpeg({ 
                quality: 70,
                mozjpeg: true 
            })
            .toFile(filePath);
        const updatedUser = await User.findByIdAndUpdate(
            req.user.userId,
            { avatar: `/uploads/${filename}` },
            { new: true }
        );
        if (oldAvatar && !oldAvatar.includes('default-avatar')) {
            const oldPath = path.join(__dirname, '../', oldAvatar);
            
            fs.access(oldPath, fs.constants.F_OK, (err) => {
                if (!err) {
                    fs.unlink(oldPath, (unlinkErr) => {
                        if (unlinkErr) console.error('Error deleting old avatar:', unlinkErr);
                    });
                }
            });
        }

        res.json({ avatar: updatedUser.avatar });

    } catch (error) {
        console.error('Error updating avatar:', error);
        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
        }
        res.status(500).json({ error: 'Error processing image' });
    }
});
/**
 * @swagger
 * /user/update-profile:
 *   put:
 *     summary: Update the profile of the authenticated user
 *     tags:
 *       - User
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
 *                 example: John Doe
 *               role:
 *                 type: string
 *                 enum: [user, admin]
 *                 example: user
 *               country:
 *                 type: string
 *                 enum: [MD, US, RO]
 *                 example: MD
 *               language:
 *                 type: string
 *                 enum: [en, ro, ru]
 *                 example: en
 *               currency:
 *                 type: string
 *                 enum: [USD, EUR, MDL]
 *                 example: USD
 *               phoneNumber:
 *                 type: string
 *                 example: "0712345678"
 *               twoFactorEnabled:
 *                 type: boolean
 *                 example: true
 *     responses:
 *       200:
 *         description: User profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 name:
 *                   type: string
 *                 role:
 *                   type: string
 *                 country:
 *                   type: string
 *                 language:
 *                   type: string
 *                 currency:
 *                   type: string
 *                 phoneNumber:
 *                   type: string
 *                 twoFactorEnabled:
 *                   type: boolean
 *       400:
 *         description: Validation error
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

router.put('/update-profile', authMiddleware, async (req, res) => {
  try {
    const {
      name,
      fullName,
      dateOfBirth,
      accountType,
      country,
      language,
      currency,
      phoneNumber,
      twoFactorEnabled
    } = req.body;
    const allowedAccountTypes = ['standard', 'premium', 'vip'];
    if (accountType && !allowedAccountTypes.includes(accountType)) {
      return res.status(400).json({ error: 'Invalid account type' });
    }
    if (name && name.length < 2) {
      return res.status(400).json({ error: 'The name must have at least 2 characters' });
    }
    if (fullName && fullName.trim().length < 3) {
      return res.status(400).json({ error: 'The full name must contain at least 3 characters' });
    }
    const allowedCountries = ['MD', 'US', 'RO'];
    const allowedLanguages = ['en', 'ro', 'ru'];
    const allowedCurrencies = ['USD', 'EUR', 'MDL'];

    if (country && !allowedCountries.includes(country)) {
      return res.status(400).json({ error: 'Invalid country' });
    }

    if (language && !allowedLanguages.includes(language)) {
      return res.status(400).json({ error: 'Invalid language' });
    }

    if (currency && !allowedCurrencies.includes(currency)) {
      return res.status(400).json({ error: 'Invalid currency' });
    }
    if (phoneNumber && !/^\d{10}$/.test(phoneNumber)) {
      return res.status(400).json({ error: 'Invalid phone number' });
    }
    const updateFields = {
      ...(name && { name }),
      ...(fullName !== undefined && { fullName }),
      ...(dateOfBirth !== undefined && { dateOfBirth }),
      ...(accountType && { accountType }),
      ...(country && { country }),
      ...(language && { language }),
      ...(currency && { currency }),
      ...(phoneNumber && { phoneNumber }),
      ...(twoFactorEnabled !== undefined && { twoFactorEnabled })
    };
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { $set: updateFields },
      { new: true, runValidators: true }
    ).select('-password');
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      fullName: updatedUser.fullName,
      dateOfBirth: updatedUser.dateOfBirth,
      accountType: updatedUser.accountType,
      country: updatedUser.country,
      language: updatedUser.language,
      currency: updatedUser.currency,
      phoneNumber: updatedUser.phoneNumber,
      twoFactorEnabled: updatedUser.twoFactorEnabled
    });

  } catch (error) {
    console.error('Profile update error:', error);
    res.status(500).json({ error: 'Server error' });
  }
});

  
/**
 * @swagger
 * /update-password:
 *   put:
 *     summary: Change user password
 *     description: Allows authenticated users to change their current password.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password updated successfully
 *       400:
 *         description: Incorrect current password
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

router.put('/update-password', authMiddleware, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      const user = await User.findById(req.user.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(400).json({ error: 'Incorrect current password' });
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
      await user.save();
      res.json({ success: true, message: 'Password successfully updated' });
    } catch (error) {
      console.error('Password change error:', error);
      res.status(500).json({ error: 'Server error while changing password' });
    }
  });

/**
 * @swagger
 * /update-email:
 *   put:
 *     summary: Update user email
 *     description: Allows authenticated users to change their email address after verifying password.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - newEmail
 *               - currentPassword
 *             properties:
 *               newEmail:
 *                 type: string
 *                 format: email
 *               currentPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email updated successfully
 *       400:
 *         description: Validation error or email already in use
 *       401:
 *         description: Incorrect password
 *       500:
 *         description: Server error
 */

  router.put('/update-email', authMiddleware, async (req, res) => {
    try {
      const { newEmail, currentPassword } = req.body;
      const user = await User.findById(req.user.userId);
      if (!user) return res.status(404).json({ error: 'User not found' });
      if (!/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/.test(newEmail)) {
        return res.status(400).json({ error: 'Format email invalid' });
      }
      if (user.email === newEmail) {
        return res.status(400).json({ error: 'The new email is identical to the old one' });
      }
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) return res.status(401).json({ error: 'Incorrect password' });
      const existingUser = await User.findOne({ email: newEmail });
      if (existingUser) return res.status(400).json({ error: 'Email already in use' });
      user.email = newEmail;
      await user.save();
      const token = jwt.sign(
        { userId: user._id, email: newEmail },
        process.env.JWT_SECRET,
        { expiresIn: '72h' }
      );
      res.json({
        success: true,
        message: 'Email successfully updated',
        email: user.email,
        token
      });
    } catch (error) {
      console.error('Error updating email:', error);
      res.status(500).json({ error: 'Server error' });
    }
  });
  /**
 * @swagger
 * /payment-settings:
 *   get:
 *     summary: Get user's payment settings
 *     description: Retrieves payment methods, billing address, and past transactions for the authenticated user.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Payment settings retrieved successfully
 *       500:
 *         description: Server error
 */

  router.get('/payment-settings', authMiddleware, async (req, res) => {
    try {
      const user = await User.findById(req.user.userId)
        .select('paymentMethods billingAddress transactions');
      res.json(user);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  /**
 * @swagger
 * /payment-methods:
 *   put:
 *     summary: Update payment methods
 *     description: Replaces the user's current payment methods with new ones.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: array
 *             items:
 *               type: object
 *               properties:
 *                 cardNumber:
 *                   type: string
 *                 expiryDate:
 *                   type: string
 *                 cardholderName:
 *                   type: string
 *     responses:
 *       200:
 *         description: Payment methods updated
 *       500:
 *         description: Server error
 */

  router.put('/payment-methods', authMiddleware, async (req, res) => {
    try {
      const paymentMethods = req.body;
      const updatedUser = await User.findByIdAndUpdate(
        req.user.userId,
        { paymentMethods: paymentMethods },
        { new: true, select: 'paymentMethods' }
      ).lean();
      res.json(updatedUser.paymentMethods); 
    } catch (error) {
      console.error('Error updating payment methods:', error);
      res.status(500).json({ error: 'Server error with payment methods' });
    }
  });
/**
 * @swagger
 * /billing-address:
 *   put:
 *     summary: Update billing address
 *     description: Allows the authenticated user to update their billing address.
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, street, city, state, zipCode, country]
 *             properties:
 *               name:
 *                 type: string
 *               street:
 *                 type: string
 *               city:
 *                 type: string
 *               state:
 *                 type: string
 *               zipCode:
 *                 type: string
 *               country:
 *                 type: string
 *                 enum: [MD, US, RO]
 *     responses:
 *       200:
 *         description: Billing address updated
 *       400:
 *         description: Missing or invalid fields
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

router.put('/billing-address', authMiddleware, async (req, res) => {
  try {
    const billingAddress = req.body;
    const requiredFields = ['name', 'street', 'city', 'state', 'zipCode', 'country'];
    for (let field of requiredFields) {
      if (!billingAddress[field]) {
        return res.status(400).json({ error: `Missing field: ${field}` });
      }
    }
    const allowedCountries = ['MD', 'US', 'RO'];
    if (!allowedCountries.includes(billingAddress.country)) {
      return res.status(400).json({ error: 'Invalid country for address' });
    }
    const updatedUser = await User.findByIdAndUpdate(
      req.user.userId,
      { billingAddress },
      { new: true, select: 'billingAddress' }
    ).lean();
    if (!updatedUser) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(updatedUser.billingAddress);
  } catch (error) {
    console.error('Error updating billing address:', error);
    res.status(500).json({ error: 'Server error with billing address' });
  }
});
/**
 * @swagger
 * /search:
 *   get:
 *     summary: Search for users
 *     description: Search for users by name (minimum 3 characters). Excludes the current authenticated user.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: q
 *         in: query
 *         required: true
 *         description: Search query
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Matching users found
 *       400:
 *         description: Invalid search query
 *       500:
 *         description: Server error
 */

router.get('/search', authMiddleware, async (req, res) => {
    try {
        const query = req.query.q;
        if (!query || query.length < 3) {
            return res.status(400).json({ error: 'Search query must be at least 3 characters' });
        }
        const users = await User.find({
            name: { $regex: query, $options: 'i' },
            _id: { $ne: req.user.userId }
        })
        .select('_id name avatar status') 
        .lean();
        const results = users.map(user => ({
            _id: user._id, 
            name: user.name,
            avatar: user.avatar ? `http://localhost:5000${user.avatar}` : null,
            status: user.status
        }));
        res.json(results);
    } catch (error) {
        console.error('Search error:', error);
        res.status(500).json({ error: 'Server error' });
    }
});
/**
 * @swagger
 * /user/{userId}/friends:
 *   get:
 *     summary: Get user's friends
 *     description: Returns a list of friends for the specified user.
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: userId
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Friends list
 *       404:
 *         description: User not found
 *       500:
 *         description: Server error
 */

  router.get('/user/:userId/friends', authMiddleware, async (req, res) => {
    try {
      const user = await User.findById(req.params.userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      const populatedUser = await User.findById(req.params.userId)
        .populate({
          path: 'friends',
          select: 'name avatar status',
          transform: doc => ({
            _id: doc._id,
            name: doc.name,
            avatar: doc.avatar ? `http://localhost:5000${doc.avatar}` : null,
            status: doc.status
          })
        });
  
      res.json(populatedUser.friends || []);
    } catch (error) {
      console.error('Error retrieving friends:', error);
      res.status(500).json({ error: 'Erorr server' });
    }
  });
/**
 * @swagger
 * /figurines:
 *   get:
 *     summary: Get collected Marvel figures
 *     description: Retrieves all collected Marvel figurines for the authenticated user.
 *     tags: [Collection]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Figurines retrieved
 *       500:
 *         description: Server error
 */

  router.get('/figurines', authMiddleware, async (req, res) => {
    try {
      const figures = await MarvelFigure.find({ userId: req.user.userId });
      res.json(figures);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  
/**
 * @swagger
 * /collect-figure:
 *   post:
 *     summary: Add a new Marvel figure to the collection
 *     description: Allows the authenticated user to add a new collected Marvel figure.
 *     tags: [Collection]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [marvelId, name]
 *             properties:
 *               marvelId:
 *                 type: string
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               thumbnail:
 *                 type: string
 *               details:
 *                 type: string
 *     responses:
 *       201:
 *         description: Figure added
 *       500:
 *         description: Server error
 */

  router.post('/collect-figure', authMiddleware, async (req, res) => {
    try {
      const { marvelId, name, description, thumbnail, details } = req.body;
      const newFigure = await MarvelFigure.create({
        userId: req.user.userId,
        marvelId,
        name,
        description,
        thumbnail,
        details
      });
      res.status(201).json(newFigure);
    } catch (error) {
      res.status(500).json({ error: 'Server error' });
    }
  });
  router.get('/:userId/inventory', async (req, res) => {
    try {
      const user = await User.findById(req.params.userId)
        .select('inventory')
        .lean();
      res.json(user.inventory);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching inventory' });
    }
  });



/**
 * @swagger
 * /delete-account:
 *   delete:
 *     summary: Delete user account
 *     description: Permanently deletes the authenticated user's account and all associated data.
 *     tags: [Users]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - password
 *             properties:
 *               password:
 *                 type: string
 *                 description: User's current password for verification
 *     responses:
 *       200:
 *         description: Account deleted successfully
 *       401:
 *         description: Incorrect password or unauthorized
 *       500:
 *         description: Server error during account deletion
 */
router.delete('/delete-account', authMiddleware, async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: 'Password is required' });
    }

    const user = await User.findById(req.user.userId).select('+password');
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ error: 'Incorrect password' });
    }
    if (user.avatar && !user.avatar.includes('default-avatar')) {
      const avatarPath = path.join(__dirname, '../', user.avatar);
      if (fs.existsSync(avatarPath)) {
        fs.unlinkSync(avatarPath);
      }
    }
    await User.findByIdAndDelete(req.user.userId);
    res.json({ success: true, message: 'Account deleted successfully' });
  } catch (error) {
    console.error('Account deletion error:', error);
    res.status(500).json({ error: 'Error deleting account' });
  }
});
module.exports = router;
