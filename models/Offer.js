const mongoose = require('mongoose');

const OfferSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'The title cannot exceed 100 characters']
    },
    type: {
      type: String,
      enum: {
        values: ['coins', 'bundle'],
        message: 'The type must be "coins" or "bundle"'
      },
      required: [true, 'Type is required']
    },
    coins: {
      type: Number,
      required: [true, 'The number of coins is required'],
      min: [1, 'Coins must be at least 1']
    },
    bonus: {
      type: Number,
      default: 0,
      min: [0, 'The bonus cannot be negative']
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'The price cannot be negative']
    },
    popularity: {
      type: Number,
      default: 0,
      min: [0, 'Popularity cannot be negative'],
      max: [5, 'The maximum popularity is 5']
    },
    limited: {
      type: Boolean,
      default: false
    },
    image: {
      type: String,
      validate: {
        validator: v => /^(http|https):\/\/[^ "]+$/.test(v),
        message: props => `${props.value} Not a valid image URL`
      }
    },
    includedCharacters: {
      type: [String],
      default: [] 
    }
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

module.exports = mongoose.model('Offer', OfferSchema);
