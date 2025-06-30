const express = require('express');
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const Order = require('../models/Order');
const { auth, checkOrderAccess } = require('../middleware/auth');

const router = express.Router();

// @route   POST /api/payments/create-payment-intent
// @desc    Create payment intent for order
// @access  Private
router.post('/create-payment-intent', auth, checkOrderAccess, async (req, res) => {
  try {
    const order = req.order;
    
    // Check if user is the buyer
    if (order.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only buyers can initiate payments.' });
    }

    // Check if order is approved
    if (order.status !== 'approved') {
      return res.status(400).json({ message: 'Order must be approved before payment.' });
    }

    // Calculate payment amount (10% of agreed price)
    const paymentAmount = Math.round(order.priceAgreed * 0.1 * 100); // Convert to cents

    // Create payment intent
    const paymentIntent = await stripe.paymentIntents.create({
      amount: paymentAmount,
      currency: order.currency.toLowerCase(),
      metadata: {
        orderId: order._id.toString(),
        buyerId: order.buyerId.toString(),
        sellerId: order.sellerId.toString(),
        propertyId: order.propertyId.toString()
      },
      description: `Payment for ${order.propertyId.title} - Order #${order._id}`
    });

    res.json({
      clientSecret: paymentIntent.client_secret,
      paymentAmount: paymentAmount / 100,
      currency: order.currency
    });
  } catch (error) {
    console.error('Create payment intent error:', error);
    res.status(500).json({ message: 'Server error during payment intent creation.' });
  }
});

// @route   POST /api/payments/confirm-payment
// @desc    Confirm payment and update order
// @access  Private
router.post('/confirm-payment', auth, checkOrderAccess, async (req, res) => {
  try {
    const { paymentIntentId } = req.body;
    const order = req.order;
    
    // Check if user is the buyer
    if (order.buyerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only buyers can confirm payments.' });
    }

    // Retrieve payment intent from Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);
    
    if (paymentIntent.status !== 'succeeded') {
      return res.status(400).json({ message: 'Payment has not been completed.' });
    }

    // Update order payment details
    await order.updatePaymentDetails({
      amount: paymentIntent.amount / 100,
      currency: paymentIntent.currency.toUpperCase(),
      paymentMethod: 'stripe',
      transactionId: paymentIntent.id,
      paymentStatus: 'completed',
      paymentDate: new Date()
    });

    res.json({
      message: 'Payment confirmed successfully',
      order
    });
  } catch (error) {
    console.error('Confirm payment error:', error);
    res.status(500).json({ message: 'Server error during payment confirmation.' });
  }
});

// @route   POST /api/payments/webhook
// @desc    Handle Stripe webhooks
// @access  Public
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    switch (event.type) {
      case 'payment_intent.succeeded':
        const paymentIntent = event.data.object;
        console.log('Payment succeeded:', paymentIntent.id);
        
        // Update order if needed
        if (paymentIntent.metadata.orderId) {
          const order = await Order.findById(paymentIntent.metadata.orderId);
          if (order) {
            await order.updatePaymentDetails({
              amount: paymentIntent.amount / 100,
              currency: paymentIntent.currency.toUpperCase(),
              paymentMethod: 'stripe',
              transactionId: paymentIntent.id,
              paymentStatus: 'completed',
              paymentDate: new Date()
            });
          }
        }
        break;

      case 'payment_intent.payment_failed':
        const failedPayment = event.data.object;
        console.log('Payment failed:', failedPayment.id);
        
        // Update order if needed
        if (failedPayment.metadata.orderId) {
          const order = await Order.findById(failedPayment.metadata.orderId);
          if (order) {
            await order.updatePaymentDetails({
              paymentStatus: 'failed'
            });
          }
        }
        break;

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    res.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    res.status(500).json({ message: 'Webhook processing failed.' });
  }
});

// @route   GET /api/payments/order/:orderId/payment-status
// @desc    Get payment status for an order
// @access  Private
router.get('/order/:orderId/payment-status', auth, checkOrderAccess, async (req, res) => {
  try {
    const order = req.order;
    
    res.json({
      paymentStatus: order.paymentDetails.paymentStatus,
      amount: order.paymentDetails.amount,
      currency: order.paymentDetails.currency,
      paymentDate: order.paymentDetails.paymentDate,
      transactionId: order.paymentDetails.transactionId
    });
  } catch (error) {
    console.error('Get payment status error:', error);
    res.status(500).json({ message: 'Server error during payment status fetch.' });
  }
});

// @route   POST /api/payments/refund
// @desc    Process refund for an order
// @access  Private
router.post('/refund', auth, checkOrderAccess, async (req, res) => {
  try {
    const { reason } = req.body;
    const order = req.order;
    
    // Check if user is the seller
    if (order.sellerId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: 'Only sellers can process refunds.' });
    }

    // Check if payment was completed
    if (order.paymentDetails.paymentStatus !== 'completed') {
      return res.status(400).json({ message: 'No completed payment to refund.' });
    }

    // Process refund through Stripe
    const refund = await stripe.refunds.create({
      payment_intent: order.paymentDetails.transactionId,
      reason: reason || 'requested_by_customer'
    });

    // Update order payment details
    await order.updatePaymentDetails({
      paymentStatus: 'refunded'
    });

    res.json({
      message: 'Refund processed successfully',
      refundId: refund.id,
      order
    });
  } catch (error) {
    console.error('Refund error:', error);
    res.status(500).json({ message: 'Server error during refund processing.' });
  }
});

// @route   GET /api/payments/payment-methods
// @desc    Get available payment methods
// @access  Private
router.get('/payment-methods', auth, async (req, res) => {
  try {
    const paymentMethods = [
      {
        id: 'card',
        name: 'Credit/Debit Card',
        description: 'Pay with Visa, Mastercard, American Express, or Discover',
        icon: '💳'
      },
      {
        id: 'bank_transfer',
        name: 'Bank Transfer',
        description: 'Direct bank transfer (may take 1-3 business days)',
        icon: '🏦'
      }
    ];

    res.json({ paymentMethods });
  } catch (error) {
    console.error('Get payment methods error:', error);
    res.status(500).json({ message: 'Server error during payment methods fetch.' });
  }
});

module.exports = router; 