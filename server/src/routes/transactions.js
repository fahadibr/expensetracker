const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const transactionController = require('../controllers/transactionController');

const router = express.Router();

router.use(authenticate);

const transactionValidation = [
  body('accountId').notEmpty().withMessage('Account is required'),
  body('transactionType')
    .isIn(['income', 'expense', 'transfer'])
    .withMessage('Transaction type must be income, expense, or transfer'),
  body('amount')
    .isFloat({ gt: 0 })
    .withMessage('Amount must be a positive number'),
  body('transactionDate')
    .isISO8601()
    .withMessage('Valid date is required'),
  body('categoryId').optional({ nullable: true }),
  body('description').optional().trim(),
  body('toAccountId').optional({ nullable: true }),
];

// Get all transactions (with filters)
router.get('/', transactionController.getTransactions);

// Get single transaction
router.get('/:id', transactionController.getTransaction);

// Create transaction
router.post('/', transactionValidation, validate, transactionController.createTransaction);

// Update transaction
router.put('/:id', transactionValidation, validate, transactionController.updateTransaction);

// Delete transaction
router.delete('/:id', transactionController.deleteTransaction);

module.exports = router;
