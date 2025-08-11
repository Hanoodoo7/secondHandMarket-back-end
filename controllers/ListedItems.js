const express = require('express')
const verifyToken = require('../middleware/verify-token.js')
const ListedItem = require('../models/ListedItems.js')
const router = express.Router()

router.get('/:listedItemId', async (req, res) => {
  try {
    const ListedItem = await ListedItem.findById(req.params.hootId).populate('author');
    res.status(200).json(ListedItem);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get('/', async (req, res) => {
  try {
    const ListedItems = await ListedItem.find({})
      .populate('author')
      .sort({ createdAt: 'desc' });
    res.status(200).json(ListedItems);
  } catch (error) {
    res.status(500).json(error);
  }
});