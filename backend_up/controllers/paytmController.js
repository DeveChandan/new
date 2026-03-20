const https = require('https');

const PaytmChecksum = require('paytmchecksum');

const Payment = require('../models/Payment');

const { activateSubscription, activateWorklogAddon, calculatePlanPrice } = require('../services/subscriptionService');



// Use environment variables for Paytm config

const PAYTM_MID = process.env.PAYTM_MID || 'YOUR_MID_HERE';

const PAYTM_MERCHANT_KEY = process.env.PAYTM_MERCHANT_KEY;

const WEBSITE = process.env.PAYTM_WEBSITE || 'WEBSTAGING';

const INDUSTRY_TYPE_ID = process.env.PAYTM_INDUSTRY_TYPE_ID || 'Retail';

const CALLBACK_URL = process.env.PAYTM_CALLBACK_URL;



/**

 * Initiate Paytm Payment

 * @route POST /api/payments/paytm/initiate

 */

exports.initiateWithPaytm = async (req, res) => {

    try {

        const { orderId, customerId, email, phone, planId, platform } = req.body;

        let { amount } = req.body;



        if (!orderId || !customerId || !planId) {

            return res.status(400).json({ success: false, message: 'Missing required fields' });

        }



        // --- SECURITY FIX: Dynamic Price Calculation ---
        // Instead of trusting client-provided 'amount', we calculate it on the server
        const pricing = await calculatePlanPrice(customerId, planId);
        const calculatedAmount = pricing.totalAmount;

        // If amount was provided, we can log if it doesn't match (for auditing manipulation attempts)
        if (amount && Math.abs(parseFloat(amount) - calculatedAmount) > 1) {
            console.warn(`🚨 Price Manipulation Attempt! User ${customerId} requested ${amount} for ${planId}, but calculated price is ${calculatedAmount}.`);
        }

        // Always use the server-calculated price
        amount = calculatedAmount;
        // ----------------------------------------------



        const MID = PAYTM_MID.trim();

        const MKEY = (PAYTM_MERCHANT_KEY || '').trim();



        const paytmParams = {};



        paytmParams.body = {

            "requestType": "Payment",

            "mid": MID,

            "websiteName": WEBSITE.trim(),

            "orderId": orderId.toString().trim(),

            "callbackUrl": (process.env.PAYTM_CALLBACK_URL && process.env.PAYTM_CALLBACK_URL.trim().endsWith('=')

                ? process.env.PAYTM_CALLBACK_URL.trim() + orderId.toString().trim()

                : (process.env.PAYTM_CALLBACK_URL ? process.env.PAYTM_CALLBACK_URL.trim() + `?ORDER_ID=${orderId}` : "")),

            "txnAmount": {

                "value": parseFloat(amount).toFixed(2),

                "currency": "INR",

            },

            "userInfo": {

                "custId": customerId.toString().trim(),

                "mobile": phone ? phone.toString().trim() : "",

                "email": email ? email.toString().trim() : "",

            },

        };



        // Add channelId and industryTypeId dynamically based on platform
        paytmParams.body.channelId = platform === 'web' ? 'WEB' : (process.env.PAYTM_CHANNEL_ID || "WAP").trim();
        paytmParams.body.industryTypeId = (process.env.PAYTM_INDUSTRY_TYPE_ID || "Retail").trim();



        // Remove empty fields from userInfo to avoid validation errors

        if (!paytmParams.body.userInfo.mobile) delete paytmParams.body.userInfo.mobile;

        if (!paytmParams.body.userInfo.email) delete paytmParams.body.userInfo.email;



        // Generate checksum

        let checksum;

        try {

            // Validate merchant key — accept any non-empty key that isn't a placeholder

            if (!MKEY || MKEY === 'YOUR_KEY_HERE') {

                console.error('❌ Paytm Error: PAYTM_MERCHANT_KEY is not set or is still a placeholder in .env');

                return res.status(500).json({

                    success: false,

                    message: 'Paytm configuration error: PAYTM_MERCHANT_KEY is missing or not configured. Please check your .env file.'

                });

            }



            // For V1 APIs, Paytm expects the signature on the JSON string of the body

            const bodyString = JSON.stringify(paytmParams.body);

            checksum = await PaytmChecksum.generateSignature(bodyString, MKEY);

        } catch (checksumError) {

            console.error('Checksum Generation Error:', checksumError);

            return res.status(500).json({ success: false, message: 'Failed to generate payment signature', error: checksumError.message });

        }



        paytmParams.head = {

            "signature": checksum

        };



        const post_data = JSON.stringify(paytmParams);

        console.log('Paytm Request Data:', post_data); // Log actual request for debugging



        const options = {

            hostname: WEBSITE === 'WEBSTAGING' ? 'securestage.paytmpayments.com' : 'secure.paytmpayments.com',

            port: 443,

            path: `/theia/api/v1/initiateTransaction?mid=${MID}&orderId=${orderId}`,

            method: 'POST',

            headers: {

                'Content-Type': 'application/json',

                'Content-Length': Buffer.byteLength(post_data),
                
                'User-Agent': 'Node/22'

            }

        };



        let response = "";

        const post_req = https.request(options, (post_res) => {

            post_res.on('data', (chunk) => { response += chunk; });

            post_res.on('end', async () => {

                let resData;

                try {

                    resData = JSON.parse(response);

                } catch (parseError) {

                    console.error('Paytm Response Parse Error:', response);

                    return res.status(500).json({ success: false, message: 'Invalid response from Paytm', raw: response });

                }

                // 🔍 Full response log for debugging

                console.log('🔍 Full Paytm Response:', JSON.stringify(resData, null, 2));



                if (resData.body && resData.body.resultInfo && resData.body.resultInfo.resultStatus === 'S') {

                    // Create pending payment record in DB

                    try {

                        await Payment.create({

                            user: customerId,

                            orderId: orderId,

                            amount: parseFloat(amount),

                            planId: planId,

                            platform: platform || 'mobile',

                            status: 'pending'

                        });

                    } catch (dbError) {

                        console.error('Database Error creating payment record:', dbError);

                    }



                    res.status(200).json({

                        success: true,

                        txnToken: resData.body.txnToken,

                        orderId: paytmParams.body.orderId,

                        mid: MID,

                        host: WEBSITE === 'WEBSTAGING' ? 'securestage.paytmpayments.com' : 'secure.paytmpayments.com'

                    });

                } else {

                    console.error('Paytm Initiation Failed. Status:', resData.body?.resultInfo?.resultStatus, 'Msg:', resData.body?.resultInfo?.resultMsg);

                    res.status(500).json({

                        success: false,

                        message: 'Paytm initiation failed',

                        details: resData.body ? resData.body.resultInfo : resData

                    });

                }

            });

        });



        post_req.on('error', (e) => {

            console.error('Paytm Request Error:', e);

            res.status(500).json({ success: false, message: 'Failed to connect to Paytm', error: e.message });

        });



        post_req.write(post_data);

        post_req.end();



    } catch (error) {

        console.error('Paytm Initiate Error:', error);

        res.status(500).json({ success: false, message: 'Internal server error' });

    }

};



/**

 * Handle Paytm Callback

 * @route POST /api/payments/paytm/callback

 */

exports.handlePaytmCallback = async (req, res) => {

    try {

        const paytmParams = req.body;

        const checksum = paytmParams.CHECKSUMHASH;

        delete paytmParams.CHECKSUMHASH;



        const isVerifySignature = PaytmChecksum.verifySignature(paytmParams, PAYTM_MERCHANT_KEY, checksum);



        let status = 'failure';

        let orderId = paytmParams.ORDERID;

        let txnId = paytmParams.TXNID;



        // Find the payment record

        const payment = await Payment.findOne({ orderId: orderId });



        if (isVerifySignature) {

            const resultStatus = paytmParams.STATUS;



            if (resultStatus === 'TXN_SUCCESS') {

                status = 'success';



                if (payment) {

                    if (payment.status === 'success') {

                        console.log(`Payment duplicate webhook received and skipped for order: ${orderId}`);

                    } else if (parseFloat(paytmParams.TXNAMOUNT) !== payment.amount) {

                        console.error(`🚨 Payment Amount Mismatch for order ${orderId}: Expected ${payment.amount}, got ${paytmParams.TXNAMOUNT}. Potential tampering.`);

                        payment.status = 'failure';

                        payment.gatewayResponse = paytmParams;

                        payment.gatewayResponse.errorReason = 'Amount Validation Failed';

                        await payment.save();

                        status = 'failed';

                    } else {

                        payment.status = 'success';

                        payment.txnId = txnId;

                        payment.bankTxnId = paytmParams.BANKTXNID;

                        payment.paymentMethod = paytmParams.PAYMENTMODE;

                        payment.gatewayResponse = paytmParams;

                        await payment.save();



                        // ACTIVATE SUBSCRIPTION OR ADDON

                        if (payment.planId === 'worklog_access') {

                            try {

                                await activateWorklogAddon(payment.user);

                                console.log(`✅ Worklog Access activated for user ${payment.user}`);

                            } catch (subError) {

                                console.error('❌ Failed to activate worklog addon after payment:', subError);

                            }

                        } else if (payment.planId) {

                            try {

                                await activateSubscription(payment.user, payment.planId);

                                console.log(`✅ Subscription activated for user ${payment.user} - Plan: ${payment.planId}`);

                            } catch (subError) {

                                console.error('❌ Failed to activate subscription after payment:', subError);

                            }

                        }

                    }

                }

            } else {

                status = 'failed';

                if (payment) {

                    payment.status = 'failure';

                    payment.gatewayResponse = paytmParams;

                    await payment.save();

                }

            }

        }



        // Determine Redirect URL based on platform

        let redirectUrl;

        if (payment && payment.platform === 'web') {

            const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:3000';

            redirectUrl = `${frontendUrl}/subscriptions/status?status=${status}&orderId=${orderId}&txnId=${txnId}`;

        } else {

            // Mobile App Deep Link

            redirectUrl = `shramiksevaapp://(employer)/payment-status?status=${status}&orderId=${orderId}&txnId=${txnId}`;

        }



        res.send(`

            <html>

                <head>

                    <title>Payment Status</title>

                    <meta name="viewport" content="width=device-width, initial-scale=1">

                    <style>

                        body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; display: flex; justify-content: center; alignItems: center; height: 100vh; margin: 0; background-color: #f5f5f5; }

                        .card { background: white; padding: 2rem; border-radius: 1rem; box-shadow: 0 4px 6px rgba(0,0,0,0.1); text-align: center; max-width: 90%; }

                        h1 { color: ${status === 'success' ? '#4CAF50' : '#F44336'}; margin-bottom: 1rem; }

                        p { color: #666; margin-bottom: 2rem; }

                        .btn { display: inline-block; background: #2196F3; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; font-weight: bold; }

                    </style>

                </head>

                <body>

                    <div class="card">

                        <h1>Payment ${status === 'success' ? 'Successful' : 'Failed'}</h1>

                        <p>You will be redirected back to the app shortly...</p>

                        <a href="${redirectUrl}" class="btn">Return to App</a>

                    </div>

                    <script>

                        setTimeout(function() {

                            window.location.href = "${redirectUrl}";

                        }, 1000);

                    </script>

                </body>

            </html>

        `);



    } catch (error) {

        console.error('Callback Error:', error);

        res.status(500).send('<h1>Something went wrong processing the callback</h1>');

    }

};



/**

 * Render Paytm Payment Form (for WebBrowser handoff)

 */

exports.renderPaytmForm = async (req, res) => {

    try {

        const { txnToken, orderId, mid } = req.query;



        if (!txnToken || !orderId || !mid) {

            return res.status(400).send('<h1>Invalid Payment Parameters</h1>');

        }



        const host = process.env.PAYTM_WEBSITE === 'WEBSTAGING' ? 'securestage.paytmpayments.com' : 'secure.paytmpayments.com';



        res.send(`

            <html>

                <head>

                    <title>Processing Payment...</title>

                </head>

                <body onload="document.paytmForm.submit()">

                    <center><h1>Please do not refresh this page...</h1></center>

                    <form method="post" action="https://${host}/theia/api/v1/showPaymentPage?mid=${mid}&orderId=${orderId}" name="paytmForm">

                        <input type="hidden" name="mid" value="${mid}">

                        <input type="hidden" name="orderId" value="${orderId}">

                        <input type="hidden" name="txnToken" value="${txnToken}">

                    </form>

                </body>

            </html>

        `);

    } catch (error) {

        console.error('Render Form Error:', error);

        res.status(500).send('<h1>Server Error</h1>');

    }

};