const express = require('express');
const router = express.Router();
const reviewSchema = require('../models/reviews');
const mongoose = require('mongoose');

// GET all reviews or filter by productID
router.get('/', async (req, res) => {
    try {
        const filter = {};
        if (req.query.productID) {
            filter.productID = req.query.productID;
        }
        const reviews = await reviewSchema.find(filter).populate('productID');
        res.status(200).send({ success: true, data: reviews });
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});

// GET one review by ID
router.get('/:id', async (req, res) => {
    try {
        const review = await reviewSchema.findById(req.params.id).populate('productID');
        if (!review) return res.status(404).send({ success: false, message: 'Review not found' });
        res.status(200).send({ success: true, data: review });
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});

// POST create new review
router.post('/', async (req, res) => {
    try {
        const { productID, userName, rating, comment } = req.body;

        if (!productID || !userName || !rating) {
            return res.status(400).send({ success: false, message: 'Missing required fields' });
        }

        const newReview = new reviewSchema({
            productID, userName, rating, comment
        });

        await newReview.save();
        res.status(201).send({ success: true, data: newReview });
    } catch (err) {
        res.status(400).send({ success: false, message: err.message });
    }
});

// PUT update review
router.put('/:id', async (req, res) => {
    try {
        const updated = await reviewSchema.findByIdAndUpdate(req.params.id, req.body, { new: true });
        if (!updated) return res.status(404).send({ success: false, message: 'Review not found' });
        res.status(200).send({ success: true, data: updated });
    } catch (err) {
        res.status(400).send({ success: false, message: err.message });
    }
});

// DELETE review
router.delete('/:id', async (req, res) => {
    try {
        const id = req.params.id;

        // Kiểm tra nếu ID không hợp lệ
        if (!mongoose.Types.ObjectId.isValid(id)) {
            return res.status(400).send({ success: false, message: 'Invalid review ID' });
        }

        const deleted = await reviewSchema.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).send({ success: false, message: 'Review not found' });
        }

        res.status(200).send({ success: true, message: 'Review deleted successfully' });
    } catch (err) {
        res.status(500).send({ success: false, message: err.message });
    }
});

module.exports = router;
