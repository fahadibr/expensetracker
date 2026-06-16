const express = require('express');
const { authenticate } = require('../middleware/auth');
const reportController = require('../controllers/reportController');

const router = express.Router();

router.use(authenticate);

// Monthly report
router.get('/monthly', reportController.getMonthlyReport);

// Category report
router.get('/category', reportController.getCategoryReport);

// Account report
router.get('/account', reportController.getAccountReport);

// Monthly trend (for charts)
router.get('/trend', reportController.getMonthlyTrend);

module.exports = router;
