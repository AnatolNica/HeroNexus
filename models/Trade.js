const mongoose = require('mongoose');

const collectionSchema = new mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    name: String,
    description: String,
    isPublic: Boolean,
    tags: [String],
    maxHeroes: Number,
    mainCharacterId: Number,
    displayedHeroes: [Number],
    heroes: [Number],
    createdAt: Date
}, { _id: false });

const tradeItemSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['character', 'coins', 'collection'],
        required: true
    },
    characterId: Number,
    collectionId: String,
    collection: collectionSchema,
    quantity: {
        type: Number,
        min: 1,
        default: 1
    },
    coins: {
        type: Number,
        min: 0
    }
});

const tradeSchema = new mongoose.Schema({
    initiator: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    recipient: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false,
        default: null
    },
    offeredItems: [tradeItemSchema],
    requestedItems: [tradeItemSchema],
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected', 'canceled', 'available', 'completed'],
        default: 'pending'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: Date,
    chatMessages: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            required: true
        },
        username: String,
        message: String,
        timestamp: {
            type: Date,
            default: Date.now
        }
    }]
});

tradeSchema.virtual('initiatorUsername', {
    ref: 'User',
    localField: 'initiator',
    foreignField: '_id',
    justOne: true,
    options: { select: 'username' }
});

tradeSchema.virtual('recipientUsername', {
    ref: 'User',
    localField: 'recipient',
    foreignField: '_id',
    justOne: true,
    options: { select: 'username' }
});

tradeSchema.set('toJSON', { virtuals: true });
tradeSchema.set('toObject', { virtuals: true });

module.exports = mongoose.model('Trade', tradeSchema);