const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const { createBook, updateBook, deleteBook, getBooks } = require('../controllers/adminController');
const router = express.Router();

router.post('/book', authenticate, authorize(['admin']), createBook);
router.put('/book/:id', authenticate, authorize(['admin']), updateBook);
router.delete('/book/:id', authenticate, authorize(['admin']), deleteBook);
router.get('/books', authenticate, authorize(['admin']), getBooks);

module.exports = router;