// ppcheckout.js
// ========
// capture pp single purchase and redirect to actually success-url
// now workaround: URL/
//
// Used app GUI environment vaeriables:
// PP_CLIENT_ID: The active PayPal ClientId
// PP_CLIENT_SECRET: The active PayPal client secret
// PP_SANDBOX_LIVE: The environment to use: Sandbox | Live
// PP_PARTNER_ID: PayPal Partner ID given by account manager
// URL (readonly): The active site base URL, i.e. https://abc.com


/**
 * Get base url from apps GUI environment
 */
 const { URL } = process.env;


/**
 * Require PayPal module
 * Assign to va because we will extend this module with subscription functions
 */
 var paypal = require('@paypal/checkout-server-sdk');


/**
 *
 * Set up and return PayPal JavaScript SDK environment with PayPal access credentials.
 * This sample uses SandboxEnvironment. In production, use LiveEnvironment.
 * Set environment var in apps config GUI to either Sandbox or Live
 *
 */
 function environment() {
    let clientId = process.env.PP_CLIENT_ID || 'PP_CLIENT_ID';
    let clientSecret = process.env.PP_CLIENT_SECRET || 'PP__CLIENT_SECRET';
    if (process.env.PP_SANDBOX_LIVE == "Live") {
        return new paypal.core.LiveEnvironment(
            clientId, clientSecret
        );
    }
    else {
        return new paypal.core.SandboxEnvironment(
            clientId, clientSecret
        );

    }
}


/**
 *
 * Returns PayPal HTTP client instance with environment that has access
 * credentials context. Use this instance to invoke PayPal APIs, provided the
 * credentials have access.
 */
function client() {
    return new paypal.core.PayPalHttpClient(environment());
}


/**
 * 
 * Handle API Request
 * 
 */
 export async function handler(event, context) {

    // bail if wrong http Method
    if (event.httpMethod != "GET") {
        return {
            statusCode: 405,
            body: 'You are not using a http GET method for this endpoint.',
            headers: {'Allow': 'GET'}
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
    if (!body.token) {
        return {
            statusCode: 400,
            body: 'Wrong usage of parameters.'
        } 
    }
    
    // define order capture function
    let captureOrder =  async function(orderId) {
        // create request
        request = new paypal.orders.OrdersCaptureRequest(orderId);
        
        // set body to empty
        request.requestBody({});

        // Call API with your client and get a response for your call
        let response = await client().execute(request);
        
        // Debug respponse
        //console.log(response);
        //console.log(`Response: ${JSON.stringify(response)}`);
        // If call returns body in response, you can get the deserialized version from the result attribute of the response.
        //console.log(`Capture: ${JSON.stringify(response.result)}`);
    }
    
    
    // capture order
    captureOrder(body.token); 

    // redirect to success-url
    // TODO: since we don't know it, we route to root of this site: URL/
    return {
        statusCode: 303,
        //body: {},
        headers: {
            location: URL + '/'
        }
    };

}

