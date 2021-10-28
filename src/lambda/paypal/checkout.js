// paypal/chekout.js
// ========

// get our base url from env
const { URL } = process.env;

// Get stripe secret fom env
const { PP_CLIENT_ID } = process.env;
const { PP_CLIENT_SECRET } = process.env;

// Require stripe
//const stripe = require('stripe')(STRIPE_SECRET);

module.exports = {

    checkout: function async (body) {

    },
    
};