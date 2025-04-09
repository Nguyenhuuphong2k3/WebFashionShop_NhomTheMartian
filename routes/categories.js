var express = require('express');
var router = express.Router();
let categorySchema = require('../models/categories');

/* GET categories listing. */
router.get('/', async function (req, res, next) {
  try {
    let categories = await categorySchema.find({});
    res.status(200).send({ success: true, data: categories });
  } catch (error) {
    res.status(500).send({
      success: false,
      message: error.message,
    });
  }
});

/* GET category by ID */
router.get('/:id', async function (req, res, next) {
  try {
    let category = await categorySchema.findById(req.params.id);
    if (!category) {
      return res.status(404).send({
        success: false,
        message: 'Category not found',
      });
    }
    res.status(200).send({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(404).send({
      success: false,
      message: error.message,
    });
  }
});

/* POST create new category */
router.post('/', async function (req, res, next) {
  try {
    let body = req.body;
    let newCategory = new categorySchema({
      categoryName: body.categoryName,
      description: body.description || '',
    });
    await newCategory.save();
    res.status(201).send({ success: true, data: newCategory });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

/* PUT update category by ID */
router.put('/:id', async function (req, res, next) {
  try {
    let body = req.body;
    let category = await categorySchema.findByIdAndUpdate(
      req.params.id,
      {
        categoryName: body.categoryName,
        description: body.description || '',
      },
      { new: true }
    );
    if (!category) {
      return res.status(404).send({
        success: false,
        message: 'Category not found',
      });
    }
    res.status(200).send({
      success: true,
      data: category,
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

/* DELETE category by ID */
router.delete('/:id', async function (req, res, next) {
  try {
    let category = await categorySchema.findByIdAndDelete(req.params.id);
    if (!category) {
      return res.status(404).send({
        success: false,
        message: 'Category not found',
      });
    }
    res.status(200).send({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    res.status(400).send({
      success: false,
      message: error.message,
    });
  }
});

module.exports = router;