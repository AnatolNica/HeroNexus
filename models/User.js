const mongoose = require('mongoose');
const paymentMethodSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['creditCard', 'paypal', 'bankTransfer'],
        required: true
    },
    details: {
        type: mongoose.Schema.Types.Mixed,
        required: true
    },
    cardHolderName: {
        type: String
    },
    isPrimary: {
        type: Boolean,
        default: false
    },
    addedAt: {
        type: Date,
        default: Date.now
    }
});

const billingAddressSchema = new mongoose.Schema({
    name: { type: String, required: true },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String },
    zipCode: { type: String, required: true },
    country: { type: String, enum: ['MD', 'RO', 'US'], required: true }
});

const transactionSchema = new mongoose.Schema({
    date: {
        type: Date,
        default: Date.now
    },
    amount: {
        type: Number,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed'],
        default: 'pending'
    }
});

const cartItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['character', 'offer'],
    required: [true, 'Product type is required']
  },
  productId: {
    type: Number,
    required: function() {
      return this.type === 'character';
    },
    index: true
  },
  offerId: {
    type: mongoose.Schema.Types.ObjectId,
    required: function() {
      return this.type === 'offer';
    },
    ref: 'Offer'
  },
  quantity: {
    type: Number,
    required: [true, 'Quantity is required'],
    min: [1, 'Quantity must be at least 1']
  },
  addedAt: {
    type: Date,
    default: Date.now
  }
}, { _id: false, strict: 'throw' });

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Name is required'],
        trim: true
    },
    email: {
        type: String,
        required: [true, 'Email is required'],
        unique: true,
        lowercase: true,
        match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Invalid email']
    },
    password: {
        type: String,
        required: [true, 'Password is required'],
        minlength: [6, 'Password must be at least 6 characters long']
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    },
    fullName: {
        type: String,
        trim: true,
        default: ''
    },
    dateOfBirth: {
        type: Date
    },
    accountType: {
        type: String,
        enum: ['standard', 'premium', 'vip'],
        default: 'standard'
    },
    country: {
        type: String,
        default: 'MD'
    },
    language: {
        type: String,
        enum: ['en', 'ro', 'ru'],
        default: 'ro'
    },
    currency: {
        type: String,
        enum: ['USD', 'EUR', 'MDL'],
        default: 'MDL'
    },
    phoneNumber: {
        type: String,
        default: ''
    },
    twoFactorEnabled: {
        type: Boolean,
        default: false
    },
    blockUntil: {
        type: Date,
        default: undefined
    },
    friends: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    friendRequestsSent: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    friendRequestsReceived: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    avatar: { type: String, default: 'upload-avatar' },
    status: {
        type: String,
        enum: ['online', 'offline', 'ingame'],
        default: 'offline'
    },
    gamesPlayed: {
        type: Number,
        default: 0
    },
    coins: {
        type: Number,
        default: 0,
        min: [0, 'Coins cannot be negative']
      },
    favoriteCharacters: [{
        type: Number,
        default: []
    }],
    purchasedCharacters: [{
        characterId: {
          type: Number,
          required: true
        },
        quantity: {
          type: Number,
          required: true,
          min: 1
        }
      }],
    reviews: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Review'
    }],
    paymentMethods: [paymentMethodSchema],
    billingAddress: billingAddressSchema,
    transactions: [transactionSchema],
    
    cart: {
        items: {
            type: [cartItemSchema],
            default: [],
            validate: {
                validator: function(v) {
                    return v.length <= 100;
                },
                message: 'The cart cannot contain more than 100 items'
            }
        },
        updatedAt: {
            type: Date,
            default: Date.now
        }
    },
    inventory: [{
        name: { type: String, required: true },
        description: String,
        isPublic: { type: Boolean, default: false },
        tags: [String],
        maxHeroes: { type: Number, default: 12 },
        mainCharacterId: { type: Number, required: true },
        displayedHeroes: [Number],
        heroes: {
            type: [Number],
            validate: {
              validator: function(v) {
                return new Set(v).size === v.length;
              },
              message: 'Heroes must be unique in the collection'
            }
          },
        createdAt: { type: Date, default: Date.now }
      }],
    createdAt: {
        type: Date,
        default: Date.now
    }
    
});

userSchema.methods.getPublicProfile = function() {
    const userObject = this.toObject();
    delete userObject.password;
    delete userObject.paymentMethods;
    delete userObject.transactions;
    delete userObject.cart;
    return userObject;
};

module.exports = mongoose.model('User', userSchema);