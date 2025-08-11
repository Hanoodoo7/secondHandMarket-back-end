const express = require('express')
const verifyToken = require('../middleware/verify-token.js')
const ListedItem = require('../models/ListedItems.js')
const router = express.Router()

// ========= Protected Routes =========
router.use(verifyToken)

router.post('/', async (req, res) => {
  try {
    req.body.author = req.user._id;
    const ListedItem = await ListedItem.create(req.body);
    ListedItem._doc.author = req.user;
    res.status(201).json(ListedItem);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});



module.exports = router;