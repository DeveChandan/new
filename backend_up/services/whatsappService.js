const axios = require('axios');

const {
    WHATSAPP_API_VERSION,
    WHATSAPP_PHONE_NUMBER_ID,
    WHATSAPP_ACCESS_TOKEN,
    WHATSAPP_TEMPLATE_NEW_APPLICATION,
    WHATSAPP_TEMPLATE_WORKER_HIRED,
    WHATSAPP_TEMPLATE_JOB_SUGGESTION,
    WHATSAPP_TEMPLATE_WORKER_SUGGESTION,
} = process.env;

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

const sendTemplateMessage = async (to, templateName, params = []) => {
    if (!WHATSAPP_PHONE_NUMBER_ID || !WHATSAPP_ACCESS_TOKEN || !templateName) {
        console.warn(`WhatsApp service is not configured for template '${templateName}'. Skipping message.`);
        return;
    }

    if (!to) {
        console.error(`WhatsApp service error: 'to' phone number is missing.`);
        return;
    }

    // Format phone number to E.164 (without '+') for WhatsApp API integration
    let formattedTo = String(to).replace(/\D/g, ''); // Strip non-digit characters
    if (formattedTo.length === 10) {
        // Automatically prepend India country code if it is a standard 10-digit number
        formattedTo = '91' + formattedTo;
    }

    const apiUrl = `https://graph.facebook.com/${WHATSAPP_API_VERSION || 'v19.0'}/${WHATSAPP_PHONE_NUMBER_ID}/messages`;

    const payload = {
        messaging_product: "whatsapp",
        to: formattedTo,
        type: "template",
        template: {
            name: templateName,
            language: { code: "en_US" },
            components: [{
                type: "body",
                parameters: params.map(text => ({ type: "text", text: String(text) }))
            }]
        }
    };

    let attempt = 0;
    while (attempt < MAX_RETRIES) {
        attempt++;
        try {
            console.log(`Sending WhatsApp message template '${templateName}' to ${to} (Attempt ${attempt}/${MAX_RETRIES})`);
            await axios.post(apiUrl, payload, {
                headers: {
                    'Authorization': `Bearer ${WHATSAPP_ACCESS_TOKEN}`,
                    'Content-Type': 'application/json'
                }
            });
            console.log(`Successfully sent WhatsApp message to ${to}`);
            return; // Success, exit function
        } catch (error) {
            const errorData = error.response ? error.response.data : error.message;
            console.error(`Failed to send WhatsApp message to ${to} (Attempt ${attempt}):`, JSON.stringify(errorData, null, 2));

            if (attempt >= MAX_RETRIES) {
                console.error(`Giving up on sending WhatsApp message to ${to} after ${MAX_RETRIES} attempts.`);
            } else {
                const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1); // Exponential backoff: 1s, 2s, 4s...
                console.log(`Retrying in ${delay}ms...`);
                await sleep(delay);
            }
        }
    }
};

const sendApplicationNotification = (employerPhone, data) => {
    const params = [data.workerName, data.jobTitle];
    return sendTemplateMessage(employerPhone, WHATSAPP_TEMPLATE_NEW_APPLICATION, params);
};

const sendHiredNotification = (workerPhone, data) => {
    const params = [data.jobTitle, data.employerName];
    return sendTemplateMessage(workerPhone, WHATSAPP_TEMPLATE_WORKER_HIRED, params);
};

const sendJobSuggestion = (workerPhone, data) => {
    // Params might be: 1: workerName, 2: jobTitle, 3: employerName
    const params = [data.workerName, data.jobTitle, data.employerName];
    return sendTemplateMessage(workerPhone, WHATSAPP_TEMPLATE_JOB_SUGGESTION, params);
};

const sendWorkerSuggestion = (employerPhone, data) => {
    // Params might be: 1: employerName, 2: workerName, 3: workerSkills
    const params = [data.employerName, data.workerName, data.workerSkills];
    return sendTemplateMessage(employerPhone, WHATSAPP_TEMPLATE_WORKER_SUGGESTION, params);
};

module.exports = {
    sendApplicationNotification,
    sendHiredNotification,
    sendJobSuggestion,
    sendWorkerSuggestion,
};
