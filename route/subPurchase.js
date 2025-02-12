const express = require('express');
const {
    create, 
    readall, 
    readId, 
    update, 
    deleteId, 
    readByUserId, 
    getCurrentSubscription, 
    countActiveSubscriptions, 
    countTotalSubscriptions, 
    upgradeSubscription,
    createCheckoutSession,    // Add new Stripe endpoints
    handleStripeWebhook
} = require('../controller/subPurchase');

const router = express.Router();

// Stripe webhook endpoint - Note: this needs raw body parsing
router.post(
    '/webhook',
    express.raw({type: 'application/json'}),
    handleStripeWebhook
);

// Stripe checkout session endpoint
router.post(
    '/create-checkout-session',
    createCheckoutSession
);

// Your existing routes
router.post('/create', create);
router.get('/', readall);
router.get('/active', countActiveSubscriptions);
router.get('/total', countTotalSubscriptions);
router.get('/:id', readId);
router.put('/:id', update);
router.delete('/:id', deleteId);
router.get("/user/:userId", readByUserId);
router.get("/current-subscription/:id", getCurrentSubscription);
router.patch('/upgrade/:id', upgradeSubscription);

module.exports = router;