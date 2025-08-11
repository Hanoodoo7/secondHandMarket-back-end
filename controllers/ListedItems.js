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

router.get('/:itemId', async (req,res)=>{
try{
const listedItems = await ListedItem.findById(req.params.itemId).populate('author')
    res.status(200).json(listedItems);
}
catch(error){
 res.status(500).json(error)
}
})

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














// delete item -->
router.delete('/:itemId', async (req, res) => {
    try {
        const ListedItems = await ListedItem.findById(req.params.ListedItemsId)

            if(!ListedItems.author.equals(req.user._id)){
                return res.status(403).send("cant do that my G😬🤣!")
            }

            const deletedListedItem = await ListedItems.findByIdAndDelete(req.params.ListedItemsId)
            res.status(200).json(deletedListedItem)
    } catch (err) {
        res.status(500).json(error)
    }
})

// post comment -->
router.post('/ListedItems/comments', async (req, res) => {
	try {
		req.body.author = req.user._id
		const ListedItems = await ListedItems.findById(req.params.ListedItemsId)
		ListedItems.comments.push(req.body)
		await ListedItems.save()

		// Find the newly created comment:
		const newComment = ListedItems.comments[ListedItems.comments.length - 1]

		newComment._doc.author = req.user

		// Respond with the newComment:
		res.status(201).json(newComment)
	} catch (error) {
		res.status(500).json(error)
	}
})

// update comment -->
router.put("/:itemId/comments/:commentId", verifyToken, async (req, res) => {
  try {
    const listedItems = await ListedItem.findById(req.params.itemId);
    const comment = listedItems.comments.id(req.params.commentId);

    if (comment.author.toString() !== req.user._id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to edit this comment" });
    }

    comment.text = req.body.text;
    await listedItems.save();
    res.status(200).json({ message: "Comment updated successfully" });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

// delete a comment -->
router.delete("/:itemId/comments/:commentId", verifyToken, async (req, res) => {
  try {
    const listedItems = await ListedItem.findById(req.params.itemId);
    const comment = listedItems .comments.id(req.params.commentId);

    if (comment.author.toString() !== req.user._id) {
      return res
        .status(403)
        .json({ message: "You are not authorized to edit this comment" });
    }

    listedItems.comments.remove({ _id: req.params.commentId });
    await listedItems.save();
    res.status(200).json({ message: "Comment deleted successfully" });
  } catch (err) {
    res.status(500).json({ err: err.message });
  }
});

module.exports = router;