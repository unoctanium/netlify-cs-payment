
import { parse } from 'querystring'

// Require stripe checkout
const stripe = require('./stripe/checkout');

// test for payment method
function getPaymentProvider (query) {
    if (query == "Credit Card") {
        return "stripe";
    }
    if (query == "PayPal") {
        return "paypal";
    }
}

// export API call
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
    
    // check for payment method and call correct checkout
    if (getPaymentProvider(body.payment) == "stripe") {
        return await stripe.checkout(body);
        //return (ret);
    }
    if (getPaymentProvider(body.payment) == "paypal") {
        return await paypal.checkout(body);
    }

    // Payment provider unsupportes
    return {
        statusCode: 400,
        body: 'Unsupported Payment Provider',
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