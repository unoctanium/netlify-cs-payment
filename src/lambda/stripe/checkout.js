// stripe/chekout.js
// ========

// get our base url from env
const { URL } = process.env;

// Get stripe secret fom env
const { STRIPE_SECRET } = process.env;

// Require stripe
const stripe = require('stripe')(STRIPE_SECRET);

const checkout = async(body) => {

    // set some parameters depending on purcase mode
    const purchaseMode = (body.mode == "Monthly Subscription") ? "subscription" : "payment";
    const purchasePrice = (purchaseMode == "payment") ? body["stripe-single-price-id"] : body["stripe-subscription-price-id"];
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

// export functions
module.exports = {
    checkout: checkout
};

