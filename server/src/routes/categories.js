const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const categoryController = require('../controllers/categoryController');

const router = express.Router();

router.use(authenticate);

// Get all categories
router.get('/', categoryController.getCategories);

// Create category
router.post(
  '/',
  [body('name').trim().notEmpty().withMessage('Category name is required')],
  validate,
  categoryController.createCategory
);

// Update category
router.put(
  '/:id',
  [body('name').trim().notEmpty().withMessage('Category name is required')],
  validate,
  categoryController.updateCategory
);

// Delete category
router.delete('/:id', categoryController.deleteCategory);

module.exports = router;
