const express = require('express');
// import TodoValidator from '../validator';
// import Middleware from '../../middleware';
// const {re} = require('../controller/UserController');
const {register, login, adminLogin, 
    // superAdminLogin, 
    refresh, verifyEmail, forgotPassword, resetPassword, verifyOTP} = require('../controller/user');
// import verifyToken from '../middleware/verifyToken';
// import { verifyToken, requireAdmin } from '../middleware/authMiddleware'; 




const router = express.Router();

router.post(
	'/register',
    register	
);
// router.post(
//     '/login',
//     login
// );
router.post(
    '/login',
    adminLogin
);
// router.post(
//     '/superadminlogin',
//     superAdminLogin
// );
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




module.exports = router;