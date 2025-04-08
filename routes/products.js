const express = require('express');
const router = express.Router();
const productSchema = require('../models/products');
const BuildQueries = require('../Utils/BuildQuery');

// GET all products with optional query parameters
router.get('/', async (req, res) => {
    try {
        const queries = req.query;
        const filter = BuildQueries.QueryProduct(queries) || {};
        const products = await productSchema.find(filter).populate('categoryID');
        res.status(200).send({ success: true, data: products });
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});

// GET product by ID
router.get('/:id', async (req, res) => {
    try {
        const product = await productSchema.findById(req.params.id).populate('categoryID');
        if (!product) {
            return res.status(404).send({ success: false, message: 'Product not found' });
        }
        res.status(200).send({ success: true, data: product });
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});

// POST new product
router.post('/', async (req, res) => {
    try {
        const { productName, price, quantity, description, imgURL, categoryID } = req.body;

        if (!productName || !price || !quantity || !categoryID) {
            return res.status(400).send({ success: false, message: 'Missing required fields' });
        }

        const newProduct = new productSchema({
            productName,
            price,
            quantity,
            description,
            imgURL,
            categoryID
        });

        const savedProduct = await newProduct.save();
        res.status(201).send({ success: true, data: savedProduct });
    } catch (error) {
        res.status(400).send({ success: false, message: error.message });
    }
});

// PUT update product by ID
router.put('/:id', async (req, res) => {
    try {
        const updatedProduct = await productSchema.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!updatedProduct) {
            return res.status(404).send({ success: false, message: 'Product not found' });
        }

        res.status(200).send({ success: true, data: updatedProduct });
    } catch (error) {
        res.status(400).send({ success: false, message: error.message });
    }
});

// DELETE product by ID
router.delete('/:id', async (req, res) => {
    try {
        const deletedProduct = await productSchema.findByIdAndDelete(req.params.id);
        if (!deletedProduct) {
            return res.status(404).send({ success: false, message: 'Product not found' });
        }

        res.status(200).send({ success: true, message: 'Product deleted successfully' });
    } catch (error) {
        res.status(500).send({ success: false, message: error.message });
    }
});

module.exports = router;