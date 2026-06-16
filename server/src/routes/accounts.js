const express = require('express');
const { body } = require('express-validator');
const { validate } = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');
const accountController = require('../controllers/accountController');

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Get all accounts
router.get('/', accountController.getAccounts);

// Get single account
router.get('/:id', accountController.getAccount);

// Update account
router.put(
  '/:id',
  [body('name').trim().notEmpty().withMessage('Account name is required')],
  validate,
  accountController.updateAccount
);

module.exports = router;
