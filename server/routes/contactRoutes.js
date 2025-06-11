const express = require('express'); 
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Contact = require('../models/Contact');

/**
 * @swagger
 * tags:
 *   name: Contact
 *   description: Contact form handling
 */

/**
 * @swagger
 * /contact:
 *   post:
 *     summary: Submit a contact form
 *     tags: [Contact]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - email
 *               - message
 *             properties:
 *               name:
 *                 type: string
 *                 example: John Doe
 *               email:
 *                 type: string
 *                 example: john@example.com
 *               message:
 *                 type: string
 *                 example: Hello, I would like to know more about your services.
 *     responses:
 *       201:
 *         description: Message successfully sent
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 message:
 *                   type: string
 *                   example: Mesajul a fost trimis cu succes!
 *                 data:
 *                   type: object
 *                   properties:
 *                     _id:
 *                       type: string
 *                     name:
 *                       type: string
 *                     email:
 *                       type: string
 *                     message:
 *                       type: string
 *                     createdAt:
 *                       type: string
 *       400:
 *         description: Validation errors
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 errors:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       msg:
 *                         type: string
 *                       param:
 *                         type: string
 *                       location:
 *                         type: string
 *       500:
 *         description: Server error
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                 message:
 *                   type: string
 *                 error:
 *                   type: string
 */

const contactValidations = [
  body('name')
    .trim()
    .notEmpty().withMessage('Name is required')
    .escape(),
  body('email')
    .trim()
    .notEmpty().withMessage('Email is required')
    .isEmail().withMessage('Invalid email address')
    .normalizeEmail(),
  body('message')
    .trim()
    .notEmpty().withMessage('Message is required')
    .escape()
];
router.post('/', contactValidations, async (req, res) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  try {
    const { name, email, message } = req.body;
    const contactEntry = new Contact({
      name,
      email,
      message
    });

    await contactEntry.save();
    res.status(201).json({
      success: true,
      message: 'Message sent successfully!',
      data: contactEntry
    });
  } catch (error) {
    console.error('Error saving message:', error);
    res.status(500).json({
      success: false,
      message: 'An error occurred while sending the message',
      error: error.message
    });
  }
});













module.exports = router;
