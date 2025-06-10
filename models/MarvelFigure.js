const mongoose = require('mongoose');
const marvelFigureSchema = new mongoose.Schema({
    marvelId: { 
      type: Number, 
      required: true,
      unique: true
    },
    price: { 
      type: Number, 
      default: 0,
      min: [0, 'The price cannot be negative']
    },
    description: String,
    rarity: { 
      type: String, 
      enum: {
        values: ['common', 'rare', 'epic', 'legendary'],
        message: 'Invalid rarity'
      }, 
      default: 'common'
    },
    images: [{
      type: String,
      validate: {
        validator: v => /^(http|https):\/\/[^ "]+$/.test(v),
        message: props => `${props.value} not valid`
      }
    }],
    tags: {
      type: [{
        type: String,
        validate: {
          validator: v => v.length <= 20,
          message: props => `Tag "${props.value}" exceeds 20 characters`
        }
      }],
      validate: {
        validator: v => v.length <= 10,
        message: 'A maximum of 10 tags are allowed'
      },
      default: []
    }
  }, {
    timestamps: true,
    versionKey: false
  });
module.exports = mongoose.model('MarvelFigure', marvelFigureSchema);