// stripe/chekout.js
// ========
// Used app GUI environment vaeriables:
// STRIPE_SECRET: The active stripe secret
// URL (readonly): The active site base URL, i.e. https://abc.com


/**
 * Get base url from apps GUI environment
 */
const { URL } = process.env;


/**
 * Get stripe secret from apps GUI environment
 */
const STRIPE_SECRET = process.env.STRIPE_SECRET || 'STRIPE_SECRET';


/**
 * Require stripe module
 */
const stripe = require('stripe')(STRIPE_SECRET);


/**
 * 
 * Handle stripe checkout Request (called by parent API handler)
 * 
 */
const checkout = async(body) => {

    // set some parameters depending on purchase mode provided
    const purchaseMode = (body.mode == "Monthly Subscription") ? "subscription" : "payment";
    const purchasePrice = (purchaseMode == "payment") ? body["stripe-single-price-id"] : body["stripe-subscription-price-id"];
    
    // urls in body can be local or remote (starting with http). Local ones will be completed with this sites base url
    const successUrl = body["success-url"].startsWith("http") ? body["success-url"] : URL + body["success-url"];
    const cancelUrl = body["cancel-url"].startsWith("http") ? body["cancel-url"] : URL + body["cancel-url"];

    // create stripe checkout session
    const session = await stripe.checkout.sessions.create({
        line_items: [
            {
                price: purchasePrice,
                quantity: body.quantity,
            },
        ],
        payment_method_types: [
            'card',
        ],
        mode: purchaseMode,
        success_url: successUrl,
        cancel_url: cancelUrl,
        customer_email: body.email,
        metadata: {
            'firstname': body.firstname, 
            'lastname': body.lastname,
            'email': body.email
        },
        //submit_type: 'donate'
    });

    // redirect to success-url or cancel-url
    return {
        statusCode: 303,
        //body: {},
        headers: {
            location: session.url
        }
    };
}


/**
 * Export functions
 */
module.exports = {
    checkout: checkout
};