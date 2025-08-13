const express = require('express');
const verifyToken = require('../middleware/verify-token');
const ListedItem = require('../models/ListedItem');
const multer = require('multer');
const { storage } = require('../config/cloudinary');
const upload = multer({ storage });
const router = express.Router();

// ========== Public Routes ===========
router.get('/', async (req, res) => {
  try {
    const listedItems = await ListedItem.find({})
      .populate('seller')
      .sort({ createdAt: 'desc' });
    res.status(200).json(listedItems);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch items',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.get('/:itemId', async (req, res) => {
  try {
    const listedItem = await ListedItem.findById(req.params.itemId)
      .populate('seller')
      .populate('comments.author');
    
    if (!listedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    res.status(200).json(listedItem);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to fetch item details',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// ========= Protected Routes =========
router.use(verifyToken);

router.post('/', upload.array('images', 5), async (req, res) => {
  try {
    // Basic validation
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'At least one image is required' });
    }

    const { title, description, price, condition, category, contact } = req.body;
    
    if (!title || !description || !price || !condition || !category || !contact) {
      // Clean up uploaded files if validation fails
      await Promise.all(req.files.map(file => 
        cloudinary.uploader.destroy(file.filename)
      ));
      return res.status(400).json({ error: 'All fields are required' });
    }

    const imageUrls = req.files.map(file => ({
      url: file.path,
      publicId: file.filename
    }));

    const listedItem = await ListedItem.create({
      ...req.body,
      images: imageUrls,
      seller: req.user._id
    });

    const populatedItem = await ListedItem.findById(listedItem._id)
      .populate('seller');

    res.status(201).json(populatedItem);
  } catch (error) {
    // Clean up uploaded files if error occurs
    if (req.files && req.files.length > 0) {
      await Promise.all(req.files.map(file => 
        cloudinary.uploader.destroy(file.filename)
      ));
    }
    
    res.status(500).json({ 
      error: 'Failed to create listing',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.put('/:itemId', async (req, res) => {
  try {
    const listedItem = await ListedItem.findById(req.params.itemId);
    
    if (!listedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (!listedItem.seller.equals(req.user._id)) {
      return res.status(403).json({ error: 'You are not allowed to edit this item' });
    }

    const updatedItem = await ListedItem.findByIdAndUpdate(
      req.params.itemId,
      req.body,
      { new: true }
    ).populate('seller');

    res.status(200).json(updatedItem);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to update item',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.delete('/:itemId', async (req, res) => {
  try {
    const listedItem = await ListedItem.findById(req.params.itemId);
    
    if (!listedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    if (!listedItem.seller.equals(req.user._id)) {
      return res.status(403).json({ error: 'You are not allowed to delete this item' });
    }

    // Delete associated images from Cloudinary
    if (listedItem.images && listedItem.images.length > 0) {
      await Promise.all(listedItem.images.map(image => 
        cloudinary.uploader.destroy(image.publicId)
      ));
    }

    await ListedItem.findByIdAndDelete(req.params.itemId);
    
    res.status(200).json({ message: 'Item deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to delete item',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Comments
router.post('/:itemId/comments', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const listedItem = await ListedItem.findById(req.params.itemId);
    
    if (!listedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const newComment = {
      text: text.trim(),
      author: req.user._id
    };

    listedItem.comments.push(newComment);
    await listedItem.save();
    
    const populatedComment = await ListedItem.populate(listedItem, {
      path: 'comments.author',
      select: 'username avatar'
    });

    const createdComment = populatedComment.comments.find(
      comment => comment._id.toString() === newComment._id.toString()
    );

    res.status(201).json(createdComment);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to add comment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.put('/:itemId/comments/:commentId', async (req, res) => {
  try {
    const { text } = req.body;
    
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Comment text is required' });
    }

    const listedItem = await ListedItem.findById(req.params.itemId);
    if (!listedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const comment = listedItem.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (!comment.author.equals(req.user._id)) {
      return res.status(403).json({ error: 'You are not authorized to edit this comment' });
    }

    comment.text = text.trim();
    comment.updatedAt = new Date();
    await listedItem.save();

    res.status(200).json(comment);
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to update comment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

router.delete('/:itemId/comments/:commentId', async (req, res) => {
  try {
    const listedItem = await ListedItem.findById(req.params.itemId);
    if (!listedItem) {
      return res.status(404).json({ error: 'Item not found' });
    }

    const comment = listedItem.comments.id(req.params.commentId);
    if (!comment) {
      return res.status(404).json({ error: 'Comment not found' });
    }

    if (!comment.author.equals(req.user._id)) {
      return res.status(403).json({ error: 'You are not authorized to delete this comment' });
    }

    listedItem.comments.pull(req.params.commentId);
    await listedItem.save();

    res.status(200).json({ message: 'Comment deleted successfully' });
  } catch (error) {
    res.status(500).json({ 
      error: 'Failed to delete comment',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;