const express = require('express');

const {create, readall, countVisible, toggleRestrict, readRestrictedCommunities, readId, update, deleteId, getAllVisiblesByUserId, adminReadall} = require('../controller/visible')
const {checkActiveSubscription} = require('../controller/subPurchase')
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
    checkActiveSubscription,
    readall
);

router.get(
    '/free',
    adminReadall
);

router.get(
    '/restricted',
    readRestrictedCommunities
);
router.get(
    '/count',
    countVisible
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
router.get("/user/:userId", getAllVisiblesByUserId); 

module.exports = router;