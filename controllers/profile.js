const express = require('express');
const router = express.Router();
const ListedItem = require('../models/ListedItem');


router.get('/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const items = await ListedItem.find({ seller: userId }).select('title price');

    res.status(200).json(items);
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;
