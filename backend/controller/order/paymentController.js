const stripe = require('../../config/stripe')
const userModel = require('../../models/userModel')
//const cartItems = require('../../../pages/Cart')

const paymentController = async (request, response) => {
    try {
      const cartItems = request.body;
  
      // Validate cart items
      if (!Array.isArray(cartItems) || cartItems.length === 0) {
        return response.status(400).json({
          message: 'Cart items are required',
          error: true,
          success: false,
        });
      }
  
      // Validate FRONTEND_URL environment variable
      if (!process.env.FRONTEND_URL) {
        return response.status(500).json({
          message: 'FRONTEND_URL is not defined in environment variables',
          error: true,
          success: false,
        });
      }
  
      // Validate userId and fetch user
      console.log("Cart Items:", cartItems);
      const userId = cartItems[0]?.userId || request.userId; // Assuming userId is in the first cart item
      if (!userId) {
        return response.status(400).json({
          message: 'User ID is required',
          error: true,
          success: false,
        });
      }
  
      const user = await userModel.findOne({ _id: userId });
      if (!user) {
        return response.status(404).json({
          message: 'User not found',
          error: true,
          success: false,
        });
      }
  
      console.log("User:", user);
  
      // Prepare Stripe session parameters
      const params = {
        submit_type: 'pay',
        mode: 'payment',
        payment_method_types: ['card'],
        billing_address_collection: 'auto',
        shipping_options: [
          {
            shipping_rate: 'shr_1Qd6VePu7LJVDq8dADAznNNa',
          },
        ],
        customer_email: user.email,
        line_items: cartItems.map((item) => ({
          price_data: {
            currency: 'inr',
            product_data: {
              name: item.productId.productName,
              images: item.productId.productImage, 
              metadata: {
                productId: item.productId._id,
              },
            },
            unit_amount: item.productId.sellingPrice * 100, // Convert to smallest currency unit
          },
          adjustable_quantity: {
            enabled: true,
            minimum: 1,
          },
          quantity: item.quantity,
        })),
        success_url: `${process.env.FRONTEND_URL}/success`,
        cancel_url: `${process.env.FRONTEND_URL}/cancel`,
      };
  
      // Create Stripe session
      const session = await stripe.checkout.sessions.create(params);
      response.status(200).json(session);
    } catch (error) {
      console.error("Error in paymentController:", error);
      response.status(500).json({
        message: error?.message || 'Something went wrong',
        error: true,
        success: false,
      });
    }
  };
  
  module.exports = paymentController;