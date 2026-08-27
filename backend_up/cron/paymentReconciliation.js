const cron = require('node-cron');
const Payment = require('../models/Payment');
const { activateSubscription, activateWorklogAddon } = require('../services/subscriptionService');
const { emitToUser } = require('../socket');
const { queryPaytmStatus } = require('../utils/paytmUtils');

// Main reconciliation process
const reconcilePayments = async () => {
    console.log('🔄 Running payment status reconciliation cron job...');

    const now = Date.now();
    const fiveMinutesAgo = new Date(now - 5 * 60 * 1000);
    const oneHourAgo = new Date(now - 60 * 60 * 1000);

    try {
        // 1. Auto-fail abandoned pending payments older than 1 hour (eliminates infinite accumulation)
        const expiredResult = await Payment.updateMany(
            {
                status: 'pending',
                createdAt: { $lt: oneHourAgo }
            },
            {
                $set: {
                    status: 'failure',
                    gatewayResponse: {
                        errorReason: 'Payment session expired / abandoned by user'
                    }
                }
            }
        );

        if (expiredResult.modifiedCount > 0) {
            console.log(`🧹 Auto-expired ${expiredResult.modifiedCount} stale pending payment(s) older than 1 hour.`);
        }

        // 2. Check if Paytm is configured before making external API calls
        const mid = (process.env.PAYTM_MID || '').trim();
        const mkey = (process.env.PAYTM_MERCHANT_KEY || '').trim();
        if (!mid || mid === 'YOUR_MID_HERE' || !mkey || mkey === 'YOUR_KEY_HERE') {
            console.log('ℹ️ Paytm credentials not configured in .env, skipping active status query.');
            return;
        }

        // 3. Find pending payments strictly within the active 5-minute to 1-hour window
        const pendingPayments = await Payment.find({
            status: 'pending',
            createdAt: { $gte: oneHourAgo, $lt: fiveMinutesAgo }
        }).limit(25); // Limit batch size to prevent API hammering

        if (pendingPayments.length === 0) {
            console.log('✅ No pending payments in active window (5m - 1h) for reconciliation.');
            return;
        }

        console.log(`🔍 Found ${pendingPayments.length} pending payment(s) to reconcile.`);

        // 4. Process payments sequentially to avoid concurrent API flooding
        for (const payment of pendingPayments) {
            console.log(`📡 Checking order status for Order ID: ${payment.orderId}...`);
            try {
                const resData = await queryPaytmStatus(payment.orderId);
                const body = resData.body;

                if (!body || !body.resultInfo) {
                    console.warn(`⚠️ Invalid status query response structure for order ${payment.orderId}`);
                    continue;
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
                        continue;
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
                } else {
                    console.log(`⏳ Order ${payment.orderId} is still pending at Paytm (within 1-hour window).`);
                }
            } catch (queryErr) {
                console.error(`❌ Error querying status for order ${payment.orderId}:`, queryErr.message);
            }
        }
    } catch (dbErr) {
        console.error('❌ Database error in payment reconciliation job:', dbErr);
    }
};

const registerReconciliationCron = () => {
    // Run every 10 minutes
    cron.schedule('*/10 * * * *', reconcilePayments);
};

module.exports = registerReconciliationCron;
