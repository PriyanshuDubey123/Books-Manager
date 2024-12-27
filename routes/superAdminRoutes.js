const express = require('express');
const { authenticate, authorize } = require('../middlewares/auth');
const { addUser, approveBook, rejectBook } = require('../controllers/superAdminController');
const router = express.Router();

router.post('/add-user', authenticate, authorize(['superadmin']), addUser);
router.put('/approve-book/:id', authenticate, authorize(['superadmin']), approveBook);
router.put('/reject-book/:id', authenticate, authorize(['superadmin']), rejectBook);

module.exports = router;