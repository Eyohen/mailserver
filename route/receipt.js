const express = require('express');

const {create, readAll,  readById, update, deleteById} = require('../controller/receipt')



const router = express.Router();

router.post(
	'/create',
    create
);

router.get(
    '/',
    readAll
);
router.get(
	'/:id',
    readById
);
router.put(
    '/:id',
    update
);
router.delete(
    '/:id',
    deleteById
);


module.exports = router;