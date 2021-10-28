
import { parse } from 'querystring'

const { URL } = process.env;
const { STRIPE_SECRET } = process.env;
//PP_CLIENT_ID
//PP_CLIENT_SECRET

// Configure stripe
const stripe = require('stripe')(STRIPE_SECRET);

export async function handler(event, context) {

    // bail if wrong http Method
    if (event.httpMethod != "POST") {
        return {
            statusCode: 405,
            body: 'You are not using a http POST method for this endpoint.',
            headers: {'Allow': 'POST'}
          };        
    }

    // parse request body to json
    let body = {}
    try {
      body = JSON.parse(event.body)
    } catch (e) {
      body = parse(event.body)
    }

    // Bail if parameters are missing
    if (
        !body["stripe-single-price-id"] || !body["stripe-subscription-price-id"] 
        || !body["paypal-price"] || !body["paypal-product"] || !body["paypal-subscription-id"]
        || !body.quantity || !body.mode || !body.payment
        || !body["success-url"] || !body["cancel-url"]  
        || !body.firstname || !body.lastname || !body.email 
    ) {
        return {
            statusCode: 400,
            body: 'Wrong usage of parameters.'
        } 
    }
    
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


/*
event = 
{
    "path": "Path parameter (original URL encoding)",
    "httpMethod": "Incoming request’s method name",
    "headers": {Incoming request headers},
    "queryStringParameters": {Query string parameters},
    "body": "A JSON string of the request payload",
    "isBase64Encoded": "A boolean flag to indicate if the applicable request payload is Base64-encoded"
}
*/