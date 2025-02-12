const express = require('express');

const {register, login, adminLogin,
    superAdminLogin,
      refresh, verifyEmail, forgotPassword, resetPassword, verifyOTP} = require('../controller/user');





const router = express.Router();

router.post(
	'/register',
    register	
);
router.get(
    '/verify-email',
    verifyEmail
);
router.post(
    '/login',
    login
);
router.post(
    '/adminlogin',
    adminLogin
);
router.post(
    '/superadminlogin',
    superAdminLogin
);
router.get(
    '/refresh',
    refresh
);
router.post(
    '/forgot-password',
    forgotPassword
);
router.post(
    '/reset-password',
    resetPassword
);
router.post(
    '/verify-otp',
    verifyOTP
);



module.exports = router;