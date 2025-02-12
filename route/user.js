const express = require('express');
const {create,readId, readall, countUsers,update, deleteId, readSubscribedUsers} = require('../controller/user');
// const { verifyToken, requireAdmin } = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
    '/create',
    create
);

router.get(
    '/',
    readall
);

router.get(
    '/count',
    countUsers
);

router.get(
    '/:id',
    // authMiddleware,
    // verifyToken, requireAdmin,
    readId
);

router.put(
    '/:id',
    update
);

router.delete(
    '/:id',
    deleteId
);

router.get('/subscribed-users/:userId', readSubscribedUsers);


module.exports = router;