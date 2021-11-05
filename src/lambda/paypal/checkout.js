// paypal/chekout.js
// ========
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
 * API endpoint on this server for order capture of single purchade
 */
 const API_CAPTURE = "/ppcapture";

/**
 * checkout capture URL (webhook) on this site (API path) to capture single purchase (get payment)
 * Only needed for single purchase, but not for subscription
 */
const captureURL = URL + "/.netlify/functions" + API_CAPTURE; 


/**
 * Require PayPal module
 * Assign to va because we will extend this module with subscription functions
 */
var paypal = require('@paypal/checkout-server-sdk');


/**
 * Require my extentions to paypal lib to support subscriptions in PayPaly library
 */
 paypal.subscriptions = require('./subscriptions/lib.js'); 
 module.exports = paypal;


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


//
// Helper functions to handle paypal payment
//


/**
 * 
 * Handle PayPal Single purchase
 * 
 */
const handlePaypalSinglePurchase = async(body) => {
  
    // create request
    let request = new paypal.orders.OrdersCreateRequest();

    // Option: enable extended results. Comment out to use standard results
    //request.headers["prefer"] = "return=representation";
    
    // set PayPal Partner ID if available
    if (process.env.PP_PARTNER_ID) {
        request.headers["PayPal-Partner-Attribution-Id"] = process.env.PP_PARTNER_ID;
    }

    // urls in body can be local or remote (starting with http). Local ones will be completed with this sites base url
    // TODO: The success-url will not be transmitted in PayPals API call an therefore, cannot be used in the call handler for the captureUrl (API call on this server)
    // TODO: We must find a way to transmit the success-url here in this function.
    // TODO: Otherwise we have to redirect to {URL}/ as a workaround after capture API call
    const successUrl = body["success-url"].startsWith("http") ? body["success-url"] : URL + body["success-url"];
    const cancelUrl = body["cancel-url"].startsWith("http") ? body["cancel-url"] : URL + body["cancel-url"];
    
    // define request body
    request.requestBody({
        intent: 'CAPTURE',
        payer: {
            email_address: body.email,
            name: {
              given_name: body.lastname,
              surname: body.firstname
            },
            //name: {
            //  name: body.firstname + ' ' + body.lastname
            //}
        },
        application_context: {
            //return_url: req.body['success-url'],
            return_url: captureURL,
            cancel_url: cancelUrl,
            brand_name: 'Donate trees',
            user_action: 'PAY_NOW',
            landing_page: 'LOGIN',
            shipping_preference: 'NO_SHIPPING',
            payment_method: {
                payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
            }
        },
        purchase_units: [
            {
                reference_id: 'default',
                description: req.body["paypal-product"],
                amount: {
                    currency_code: 'EUR',
                    value: body.quantity * body["paypal-price"],
                },
            },
        ],
    });
  
    // Call PayPal checkoput API to create checkout and redirect client to PayPals approval webpage
    // After client approves checkout, PayPal will send him to our capture function (API call to captureUrl un this Site) to collect payment
    let createOrder = async function () {
        let response = await client().execute(request);
        //console.log(response.result);
        
        // call approval webpage
        for (let i = 0; i < response.result.links.length; i++) {
            if (response.result.links[i].rel === 'approve') {
                // return url to redirect client for approval
                return (response.result.links[i].href);
            }
        }

        // Just in case of any problem, we return cancel_url here to redirect to merchants cancel page
        return cancelUrl; // error
    };

    // Create the order
    createOrder(); 
  }
  

  /**
   * 
   * Handle PayPal Subscription Purchase
   * 
   */
  const handlePaypalSubscriptionPurchase = async(body) => {
  
    // create timestamp for paypal subscription start (4 seconds after 'now')
    var d = new Date(Date.now() + 1*60*1000);
    d.setSeconds(d.getSeconds() + 4);
    var isDate = d.toISOString();
    var isoDate = isDate.slice(0, 19) + 'Z';
  
    // create request
    let request = new paypal.subscriptions.SubscriptionsCreateRequest();

    // Option: enable extended results. Comment out to use standard results
    //request.headers["prefer"] = "return=representation";
    
    // set PayPal Partner ID if available
    if (process.env.PP_PARTNER_ID) {
        request.headers["PayPal-Partner-Attribution-Id"] = process.env.PP_PARTNER_ID;
    }

    // urls in body can be local or remote (starting with http). Local ones will be completed with this sites base url
    const successUrl = body["success-url"].startsWith("http") ? body["success-url"] : URL + body["success-url"];
    const cancelUrl = body["cancel-url"].startsWith("http") ? body["cancel-url"] : URL + body["cancel-url"];
 
    // define request body
    request.requestBody({
      plan_id: body['paypal-subscription-id'],
      start_time: isoDate,
      quantity: body.quantity,
      /*shipping_amount: {
          currency_code: "EUR",
          value: body['paypal-price'],
      },*/
      subscriber: {
          name: {
              given_name: body.lastname,
              surname: body.firstname
          },
          email_address: body.email,
      },
      application_context: {
          brand_name: "Tree donation",
          //"locale": "en-US",
          shipping_preference: 'NO_SHIPPING',
          payment_method: {
            payer_selected: "PAYPAL",
            payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED',
          },
          user_action: "SUBSCRIBE_NOW",
          return_url: successUrl,
          cancel_url: cancelUrl
      }
    });
  
    // Call PayPal checkoput API to create checkout and redirect client to PayPals approval webpage
    // after approval, no further capture is requires. client will be redirected to successUrl or cancelUrl depending on his approval
    let createSubscription = async function () {
      let response = await client().execute(request);
      //console.log(response.result);
      
      // call approval webpage
      for (let i = 0; i < response.result.links.length; i++) {
          if (response.result.links[i].rel === 'approve') {
              return (response.result.links[i].href);
          }
    }

    // Just in case of any problem, we return cancel_url here to redirect to merchants cancel page
    return cancelUrl; // error
    };

    // Create the Subscription
    createSubscription(); 
  };


/**
 * 
 * Handle paypal checkout Request (called by parent API handler)
 * 
 */
const checkout = async(body) => {

    // set some parameters depending on purchase mode
    const purchaseMode = (body.mode == "Monthly Subscription") ? "subscription" : "payment";

    let ppResonse;
    if (purchaseMode == 'subscription') {
        ppResponse = await handlePaypalSubscriptionPurchase(body);
    } else if (purchaseMode == 'payment') {
        ppResponse = await handlePaypalSinglePurchase(body);
    }

    // redirect to success-url or cancel-url
    return {
        statusCode: 303,
        //body: {},
        headers: {
            location: ppResponse
        }
    };
}

/**
 * Export functions
 */
module.exports = {
    checkout: checkout
};