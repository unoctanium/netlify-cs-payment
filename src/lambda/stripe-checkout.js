

const { ENV } = process.env;

console.log(ENV);
// Configure stripe
//const stripe = require('stripe')(stripeConfig.secret);

export async function handler(event, context) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: `Hello world ${Math.floor(Math.random() * 10)}` })
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