const mongoose = require('mongoose');
const { Schema } = mongoose;

const commentSchema = new Schema({
  text: {
    type: String,
    required: true
  },
  author: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  }
}, { timestamps: true });

const itemSchema = new Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 1000
  },
  category: {
    type: String,
    required: true,
    enum: [
      'Electronics',
      'Furniture & Home',
      'Wearables',
      'Books',
      'Sports',
      'Hobbies',
      'Spare Parts',
      'Toys',
      'Vehicles',
      'Other'
    ]
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  condition: {
    type: String,
    required: true,
    enum: ['Never Used', 'Used Once', 'Used']
  },
  images: [{
    url: {
      type: String,
      required: true
    },
    public_id: {
      type: String,
      required: true
    }
  }],
  seller: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  { 
  status: {
    type: String,
    enum: ['Available', 'Pending', 'Sold'],
    default: 'Available'
  },
  comments: [commentSchema] 
}, { timestamps: true });

const Item = mongoose.model('Item', itemSchema);
module.exports = Item;