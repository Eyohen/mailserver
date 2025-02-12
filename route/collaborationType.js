const express = require('express');

const {create, readall, readId, update, deleteId, readByUserId, getCollaborationTypeWithPurchases} = require('../controller/collaborationType')
// import verifyToken from '../middleware/verifyToken';
// import { verifyToken, requireAdmin } from '../middleware/authMiddleware'; 
// const multer = require('multer');


const router = express.Router();

// set up multer storage for file uploads
// const storage = multer.memoryStorage();
// const upload = multer({storage});



router.post(
	'/create',
    // verifyToken,
    create
);

router.get(
    '/',
    readall
);
router.get(
	'/:id',
    // verifyToken,
    readId
);
router.put(
    '/:id',
    // verifyToken,
    update
);
router.delete(
    '/:id',
    // verifyToken,
    deleteId
);
router.get("/user/:userId", readByUserId); 
router.get("/purchases/:id", getCollaborationTypeWithPurchases); 

module.exports = router;