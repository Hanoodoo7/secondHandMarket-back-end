const express = require('express');
const verifyToken = require('../middleware/verify-token.js');
const ListedItem = require('../models/ListedItem.js');
const router = express.Router();

// ========== Public Routes ===========


router.get('/', async (req, res) => {
  try {
    const listedItems = await ListedItem.find({})
      .populate('author')
      .sort({ createdAt: 'desc' });
    res.status(200).json(listedItems);
  } catch (error) {
    res.status(500).json(error);
  }
});


// ========= Protected Routes =========
router.use(verifyToken);

router.post('/', async (req, res) => {
  try {
    req.body.author = req.user._id;
    const listedItems = await ListedItem.create(req.body);
    listedItems._doc.author = req.user;
    res.status(201).json(listedItems);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

module.exports = router;