const express = require('express');
const { loginUser , createSuperAdmin, logoutUser, forgotPassword, resetPassword } = require('../controllers/authController');
const { authenticate } = require('../middlewares/auth');

const router = express.Router();

router.post('/login', loginUser);
router.post('/superadmin/signup', createSuperAdmin);
router.post('/logout',authenticate,logoutUser);
router.post('/forgot-password', forgotPassword);
router.post('/reset-password', resetPassword);


module.exports = router;