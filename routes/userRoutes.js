const express = require('express');
const { authenticate } = require('../middlewares/auth');
const { purchaseBook, getBooks } = require('../controllers/userController');
const router = express.Router();

router.post('/purchase', authenticate, purchaseBook);
router.get('/get-books', getBooks);

module.exports = router;