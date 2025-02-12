const express = require('express');

const {create, readall, countCommunity, toggleRestrict, readRestrictedCommunities, readId, update, deleteId, readByUserId} = require('../controller/community')
// import verifyToken from '../middleware/verifyToken';
// import { verifyToken, requireAdmin } from '../middleware/authMiddleware'; 
const multer = require('multer');


const router = express.Router();

// set up multer storage for file uploads
const storage = multer.memoryStorage();
const upload = multer({storage});

router.post(
	'/create',
    // verifyToken,
    upload.single('imageUrl'),
    create
);

router.get(
    '/',
    readall
);
router.get(
    '/restricted',
    readRestrictedCommunities
);
router.get(
    '/count',
    countCommunity
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
router.put(
    '/restrict/:id',
    // verifyToken,
    toggleRestrict
);
router.delete(
    '/:id',
    // verifyToken,
    deleteId
);
router.get("/user/:userId", readByUserId); 

module.exports = router;