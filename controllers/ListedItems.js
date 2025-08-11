const express = require('express');
const verifyToken = require('../middleware/verify-token.js');
const ListedItem = require('../models/ListedItem.js');
const router = express.Router();

// ========== Public Routes ===========

router.get('/', async (req, res) => {
  try {
    const listedItems = await ListedItem.find({})
      .populate('seller')
      .sort({ createdAt: 'desc' });
    res.status(200).json(listedItems);
  } catch (error) {
    res.status(500).json(error);
  }
});

router.get('/:itemId', async (req, res) => {
  try {
    const listedItem = await ListedItem.findById(req.params.itemId).populate('seller');
    res.status(200).json(listedItem);
  } catch (error) {
    res.status(500).json(error);
  }
});

// ========= Protected Routes =========
router.use(verifyToken);

// new item -->
router.post('/', async (req, res) => {
  try {
    req.body.seller = req.user._id;
    const listedItem = await ListedItem.create(req.body);
    listedItem._doc.seller = req.user;
    res.status(201).json(listedItem);
  } catch (error) {
    console.log(error);
    res.status(500).json(error);
  }
});

// edit item -->
router.put('/:itemId', async (req, res) => {
  try {
    const listedItem = await ListedItem.findById(req.params.itemId);
    if (!listedItem.seller.equals(req.user._id)) {
      return res.status(403).send('You are not allowed to edit');
    }
    const updatedItem = await ListedItem.findByIdAndUpdate(
      req.params.itemId,
      req.body,
      { new: true }
    ).populate('seller');
    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(500).json(error);
  }
});


// delete item -->
router.delete('/:itemId', async (req, res) => {
  try {
    const listedItem = await ListedItem.findById(req.params.itemId);
    if (!listedItem.seller.equals(req.user._id)) {
      return res.status(403).send("You don't have permission to delete this item");
    }
    const deletedListedItem = await ListedItem.findByIdAndDelete(req.params.itemId);
    res.status(200).json(deletedListedItem);
  } catch (error) {
    res.status(500).json(error);
  }
});

// post comment -->
router.post('/:itemId/comments', async (req, res) => {
  try {
    req.body.author = req.user._id;
    const listedItem = await ListedItem.findById(req.params.itemId);
    listedItem.comments.push(req.body);
    await listedItem.save();
    
    const newComment = listedItem.comments[listedItem.comments.length - 1];
    newComment._doc.author = req.user;
    
    res.status(201).json(newComment);
  } catch (error) {
    res.status(500).json(error);
  }
});

// update comment -->
router.put('/:itemId/comments/:commentId', async (req, res) => {
  try {
    const listedItem = await ListedItem.findById(req.params.itemId);
    const comment = listedItem.comments.id(req.params.commentId);

    if (!comment || !comment.author.equals(req.user._id)) {
      return res.status(403).json({ message: 'You are not authorized to edit this comment' });
    }

    comment.text = req.body.text;
    await listedItem.save();
    res.status(200).json({ message: 'Comment updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// delete a comment -->
router.delete('/:itemId/comments/:commentId', async (req, res) => {
  try {
    const listedItem = await ListedItem.findById(req.params.itemId);
    const comment = listedItem.comments.id(req.params.commentId);

    if (!comment || !comment.author.equals(req.user._id)) {
      return res.status(403).json({ message: 'You are not authorized to delete this comment' });
    }

    listedItem.comments.pull({ _id: req.params.commentId });
    await listedItem.save();
    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;