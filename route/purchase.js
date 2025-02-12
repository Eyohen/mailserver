const express = require('express');

const {create, readall, readId, update, deleteId, readByUserId, readByCollaborationType, countTotalPurchases, getTotalAmountByCurrency} = require('../controller/purchase')
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
    '/count',
    countTotalPurchases
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
router.get("/collaboration-type/:id", readByCollaborationType); 

router.get('/total/:currency',getTotalAmountByCurrency);

module.exports = router;