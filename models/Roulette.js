const mongoose = require('mongoose');

const rouletteItemSchema = new mongoose.Schema({
  heroId: {
    type: String,
    required: true
  },
  chance: {
    type: Number,
    required: true,
    min: 0,
    max: 1
  }
});

const rouletteSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  image: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    enum: ['Heroes', 'Villains', 'Mutants', 'Anti-Heroes','Avengers']
  },
  price: {
    type: Number,
    required: true,
    min: 0.99
  },
  items: [rouletteItemSchema],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
  
});

module.exports = mongoose.model('Roulette', rouletteSchema);