const express = require('express');
const router = express.Router();
const User = require('../models/user');


router.get("/", async (req, res) => {
  try {
    const userId = req.user._id;
    const userItems = await ListedItem.find({ seller: userId }).populate(
      "seller"
    );

    res.status(200).json({
      user: req.user,
      items: userItems,
    });
  } catch (error) {
    res.status(500).json(error);
  }
});

module.exports = router;