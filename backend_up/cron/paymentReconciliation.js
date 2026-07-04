const cron = require('node-cron');
const https = require('https');
const PaytmChecksum = require('paytmchecksum');
const Payment = require('../models/Payment');
const { activateSubscription, activateWorklogAddon } = require('../services/subscriptionService');
const { emitToUser } = require('../socket');

const PAYTM_MID = (process.env.PAYTM_MID || '').trim();
const PAYTM_MERCHANT_KEY = (process.env.PAYTM_MERCHANT_KEY || '').trim();
const WEBSITE = (process.env.PAYTM_WEBSITE || 'WEBSTAGING').trim();

// Helper function to extract exact raw body string from Paytm JSON response
const extractRawBody = (jsonString) => {
    const match = jsonString.match(/"body"\s*:\s*\{/);
    if (!match) return null;

    const startIdx = match.index + match[0].indexOf('{');
    let braceCount = 1;
    let inString = false;
    let escaped = false;

    for (let i = startIdx + 1; i < jsonString.length; i++) {
        const char = jsonString[i];

        if (escaped) {
            escaped = false;
            continue;
        }

        if (char === '\\') {
            escaped = true;
            continue;
        }

        if (char === '"') {
            inString = !inString;
            continue;
        }

        if (!inString) {
            if (char === '{') {
                braceCount++;
            } else if (char === '}') {
                braceCount--;
                if (braceCount === 0) {
                    return jsonString.substring(startIdx, i + 1);
                }
            }
        }
    }
    return null;
};

// Helper function to query Paytm Status API
const queryPaytmStatus = async (orderId) => {
    if (!PAYTM_MID || PAYTM_MID === 'YOUR_MID_HERE') {
        throw new Error('PAYTM_MID is not configured.');
    }
    if (!PAYTM_MERCHANT_KEY || PAYTM_MERCHANT_KEY === 'YOUR_KEY_HERE') {
        throw new Error('PAYTM_MERCHANT_KEY is not configured.');
    }

    const paytmParams = {
        body: {
            mid: PAYTM_MID,
            orderId: orderId.toString().trim()
        }
    };

    const bodyString = JSON.stringify(paytmParams.body);
    const checksum = await PaytmChecksum.generateSignature(bodyString, PAYTM_MERCHANT_KEY);
    paytmParams.head = { signature: checksum };

    const post_data = JSON.stringify(paytmParams);
    const options = {
        hostname: WEBSITE === 'WEBSTAGING' ? 'securestage.paytmpayments.com' : 'secure.paytmpayments.com',
        port: 443,
        path: `/v3/order/status?mid=${PAYTM_MID}`,
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(post_data),
            'User-Agent': 'Node/22'
        }
    };

    return new Promise((resolve, reject) => {
        let response = "";
        const post_req = https.request(options, (post_res) => {
            post_res.on('data', (chunk) => { response += chunk; });
            post_res.on('end', () => {
                try {
                    const resData = JSON.parse(response);
                    
                    // Security Signature Check
                    if (!resData.head || !resData.head.signature) {
                        return reject(new Error("Missing Paytm security signature in response head"));
                    }

                    // Capture the exact, un-parsed raw chunk string for body straight out of the HTTP stream
                    const rawBodyString = extractRawBody(response);
                    if (!rawBodyString) {
                        return reject(new Error("Failed to extract raw body string from Paytm response"));
                    }

                    const isSignatureValid = PaytmChecksum.verifySignature(rawBodyString, PAYTM_MERCHANT_KEY, resData.head.signature);
                    
                    if (!isSignatureValid) {
                        return reject(new Error("Paytm response signature verification failed. Possible payload tampering."));
                    }

                    resolve(resData);
                } catch (parseError) {
                    reject(new Error(`Failed to parse Paytm response: ${response}. Error: ${parseError.message}`));
                }
            });
        });

        post_req.on('error', (e) => {
            reject(e);
        });

        post_req.write(post_data);
        post_req.end();
    });
};

// Main reconciliation process
const reconcilePayments = async () => {
    console.log('🔄 Running payment status reconciliation cron job...');
    
    // Find payments created > 5 minutes ago that are still marked as pending
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    try {
        const pendingPayments = await Payment.find({
            status: 'pending',
            createdAt: { $lt: fiveMinutesAgo }
        });

        if (pendingPayments.length === 0) {
            console.log('✅ No pending payments found for reconciliation.');
            return;
        }

        console.log(`🔍 Found ${pendingPayments.length} pending payments to reconcile.`);

        const reconciliationPromises = pendingPayments.map(async (payment) => {
            console.log(`📡 Checking order status for Order ID: ${payment.orderId}...`);
            try {
                const resData = await queryPaytmStatus(payment.orderId);
                const body = resData.body;

                if (!body || !body.resultInfo) {
                    console.warn(`⚠️ Invalid status query response structure for order ${payment.orderId}`);
                    return;
                }

                const resultStatus = body.resultInfo.resultStatus;
                console.log(`📊 Order ${payment.orderId} status at Paytm: ${resultStatus}`);

                if (resultStatus === 'TXN_SUCCESS') {
                    // Double check amount to prevent tampering
                    if (parseFloat(body.txnAmount) !== payment.amount) {
                        console.error(`🚨 Cron Alert: Amount Mismatch for order ${payment.orderId}: Stored ${payment.amount}, Paytm got ${body.txnAmount}. Flagging as failed.`);
                        payment.status = 'failure';
                        payment.gatewayResponse = {
                            ...body,
                            errorReason: 'Amount Validation Failed'
                        };
                        await payment.save();
                        
                        emitToUser(payment.user.toString(), 'payment:status', { 
                            orderId: payment.orderId, 
                            status: 'failed', 
                            error: 'Amount validation failed' 
                        });
                        return;
                    }

                    // Reconcile as SUCCESS
                    payment.status = 'success';
                    payment.txnId = body.txnId;
                    payment.bankTxnId = body.bankTxnId;
                    payment.paymentMethod = body.paymentMode;
                    payment.gatewayResponse = body;
                    await payment.save();

                    console.log(`✅ Order ${payment.orderId} successfully reconciled to success.`);

                    // Push live notification update via WebSockets
                    emitToUser(payment.user.toString(), 'payment:status', { 
                        orderId: payment.orderId, 
                        status: 'success', 
                        txnId: body.txnId 
                    });

                    // Activate asynchronously in background
                    setImmediate(async () => {
                        if (payment.planId === 'worklog_access') {
                            try {
                                await activateWorklogAddon(payment.user);
                                console.log(`✅ [Reconciler] Worklog Access activated asynchronously for user ${payment.user}`);
                            } catch (subError) {
                                console.error('❌ [Reconciler] Failed to activate worklog addon asynchronously:', subError);
                            }
                        } else if (payment.planId) {
                            try {
                                await activateSubscription(payment.user, payment.planId);
                                console.log(`✅ [Reconciler] Subscription activated asynchronously for user ${payment.user} - Plan: ${payment.planId}`);
                            } catch (subError) {
                                console.error('❌ [Reconciler] Failed to activate subscription asynchronously:', subError);
                            }
                        }
                    });

                } else if (resultStatus === 'TXN_FAILURE' || resultStatus === 'RESP_FAILURE') {
                    payment.status = 'failure';
                    payment.gatewayResponse = body;
                    await payment.save();

                    console.log(`❌ Order ${payment.orderId} successfully reconciled to failure.`);

                    emitToUser(payment.user.toString(), 'payment:status', { 
                        orderId: payment.orderId, 
                        status: 'failed' 
                    });
                }
                // If resultStatus is 'PENDING', let it be, we check it again in next cron execution
            } catch (queryErr) {
                console.error(`❌ Error querying status for order ${payment.orderId}:`, queryErr.message);
            }
        });

        await Promise.allSettled(reconciliationPromises);
    } catch (dbErr) {
        console.error('❌ Database error in payment reconciliation job:', dbErr);
    }
};

const registerReconciliationCron = () => {
    // Run every 10 minutes
    cron.schedule('*/10 * * * *', reconcilePayments);
};

module.exports = registerReconciliationCron;
