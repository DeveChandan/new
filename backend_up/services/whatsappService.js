const axios = require('axios');

const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Dynamically resolves configuration from process.env
 */
const getConfig = () => ({
    version: process.env.WHATSAPP_API_VERSION || 'v19.0',
    phoneNumberId: process.env.WHATSAPP_PHONE_NUMBER_ID,
    accessToken: process.env.WHATSAPP_ACCESS_TOKEN,
    templateNewApplication: process.env.WHATSAPP_TEMPLATE_NEW_APPLICATION || 'new_application',
    templateWorkerHired: process.env.WHATSAPP_TEMPLATE_WORKER_HIRED || 'worker_hired',
    templateJobSuggestion: process.env.WHATSAPP_TEMPLATE_JOB_SUGGESTION || 'job_suggestion',
    templateWorkerSuggestion: process.env.WHATSAPP_TEMPLATE_WORKER_SUGGESTION || 'worker_suggestion',
    templateAdminAnnouncement: process.env.WHATSAPP_TEMPLATE_ADMIN_ANNOUNCEMENT || 'admin_announcement',
});

/**
 * Check if WhatsApp credentials are fully configured in the environment
 * @returns {boolean}
 */
const isConfigured = () => {
    const { phoneNumberId, accessToken } = getConfig();
    return Boolean(phoneNumberId && accessToken);
};

/**
 * Formats a phone number to standard E.164 digits without '+'
 * Automatically handles 10-digit Indian numbers by prepending country code 91
 * @param {string|number} to 
 * @returns {string}
 */
const formatPhoneNumber = (to) => {
    let formatted = String(to || '').replace(/\D/g, '');
    if (formatted.length === 10) {
        formatted = '91' + formatted;
    }
    return formatted;
};

/**
 * Send an approved WhatsApp template message
 * @param {string} to - Recipient phone number
 * @param {string} templateName - Name of the approved Meta template
 * @param {Array<string>} params - Template body parameters in order
 * @returns {Promise<{success: boolean, messageId?: string, error?: any, notConfigured?: boolean}>}
 */
const sendTemplateMessage = async (to, templateName, params = []) => {
    const { version, phoneNumberId, accessToken } = getConfig();

    if (!isConfigured()) {
        console.warn(`[WhatsAppService] WhatsApp credentials not configured in environment. Skipping template '${templateName}' to ${to}`);
        return { success: false, notConfigured: true, reason: 'Credentials not configured' };
    }

    if (!to) {
        console.error(`[WhatsAppService] Error: 'to' phone number is missing.`);
        return { success: false, error: 'Recipient phone number is missing' };
    }

    if (!templateName) {
        console.error(`[WhatsAppService] Error: templateName is missing.`);
        return { success: false, error: 'Template name is missing' };
    }

    const formattedTo = formatPhoneNumber(to);
    const apiUrl = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;

    const payload = {
        messaging_product: "whatsapp",
        to: formattedTo,
        type: "template",
        template: {
            name: templateName,
            language: { code: "en_US" },
            components: [{
                type: "body",
                parameters: params.map(text => ({ type: "text", text: String(text ?? '') }))
            }]
        }
    };

    let attempt = 0;
    while (attempt < MAX_RETRIES) {
        attempt++;
        try {
            console.log(`[WhatsAppService] Sending template '${templateName}' to ${formattedTo} (Attempt ${attempt}/${MAX_RETRIES})`);
            const response = await axios.post(apiUrl, payload, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            });

            const messageId = response.data?.messages?.[0]?.id;
            console.log(`[WhatsAppService] ✅ Successfully sent template '${templateName}' to ${formattedTo} (ID: ${messageId || 'ok'})`);
            return { success: true, messageId };
        } catch (error) {
            const errorData = error.response ? error.response.data : error.message;
            console.error(`[WhatsAppService] ❌ Failed to send template to ${formattedTo} (Attempt ${attempt}):`, JSON.stringify(errorData, null, 2));

            // If it's a client error (e.g. 400 bad template, invalid number), don't waste retries
            const status = error.response?.status;
            if (status && status >= 400 && status < 500 && status !== 429) {
                return { success: false, error: errorData };
            }

            if (attempt >= MAX_RETRIES) {
                console.error(`[WhatsAppService] Giving up on sending template to ${formattedTo} after ${MAX_RETRIES} attempts.`);
                return { success: false, error: errorData };
            } else {
                const delay = RETRY_DELAY_MS * Math.pow(2, attempt - 1);
                console.log(`[WhatsAppService] Retrying in ${delay}ms...`);
                await sleep(delay);
            }
        }
    }

    return { success: false, error: 'Max retries exceeded' };
};

/**
 * Send a direct free-form text message (Valid within 24h user session window)
 * @param {string} to - Recipient phone number
 * @param {string} text - Message text
 * @returns {Promise<{success: boolean, messageId?: string, error?: any, notConfigured?: boolean}>}
 */
const sendMessage = async (to, text) => {
    const { version, phoneNumberId, accessToken } = getConfig();

    if (!isConfigured()) {
        console.warn(`[WhatsAppService] WhatsApp credentials not configured in environment. Skipping direct message to ${to}`);
        return { success: false, notConfigured: true, reason: 'Credentials not configured' };
    }

    if (!to) {
        console.error(`[WhatsAppService] Error: 'to' phone number is missing.`);
        return { success: false, error: 'Recipient phone number is missing' };
    }

    const formattedTo = formatPhoneNumber(to);
    const apiUrl = `https://graph.facebook.com/${version}/${phoneNumberId}/messages`;

    const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: formattedTo,
        type: "text",
        text: { preview_url: false, body: text }
    };

    try {
        const response = await axios.post(apiUrl, payload, {
            headers: {
                'Authorization': `Bearer ${accessToken}`,
                'Content-Type': 'application/json'
            },
            timeout: 10000
        });

        const messageId = response.data?.messages?.[0]?.id;
        console.log(`[WhatsAppService] ✅ Successfully sent direct WhatsApp message to ${formattedTo}`);
        return { success: true, messageId };
    } catch (error) {
        const errorData = error.response ? error.response.data : error.message;
        console.error(`[WhatsAppService] ❌ Failed to send direct WhatsApp message to ${formattedTo}:`, JSON.stringify(errorData, null, 2));
        return { success: false, error: errorData };
    }
};

/**
 * Send an Admin Broadcast Announcement
 * Attempts to use the approved template first; if that fails or isn't set, attempts direct message fallback.
 * @param {string} to 
 * @param {string} title 
 * @param {string} message 
 */
const sendAdminAnnouncement = async (to, title, message) => {
    const config = getConfig();

    // 1. Try template announcement first (standard for Meta Cloud API outbound broadcasts)
    if (config.templateAdminAnnouncement) {
        const result = await sendTemplateMessage(to, config.templateAdminAnnouncement, [title, message]);
        if (result.success) return result;
    }

    // 2. Fallback to direct text message
    return await sendMessage(to, `*${title}*\n\n${message}`);
};

/**
 * High-level event notification triggers
 */
const sendApplicationNotification = (employerPhone, data) => {
    const config = getConfig();
    const params = [data.workerName, data.jobTitle];
    return sendTemplateMessage(employerPhone, config.templateNewApplication, params);
};

const sendHiredNotification = (workerPhone, data) => {
    const config = getConfig();
    const params = [data.jobTitle, data.employerName];
    return sendTemplateMessage(workerPhone, config.templateWorkerHired, params);
};

const sendJobSuggestion = (workerPhone, data) => {
    const config = getConfig();
    // 1: workerName, 2: jobTitle, 3: employerName
    const params = [data.workerName, data.jobTitle, data.employerName];
    return sendTemplateMessage(workerPhone, config.templateJobSuggestion, params);
};

const sendWorkerSuggestion = (employerPhone, data) => {
    const config = getConfig();
    // 1: employerName, 2: workerName, 3: workerSkills
    const params = [data.employerName, data.workerName, data.workerSkills];
    return sendTemplateMessage(employerPhone, config.templateWorkerSuggestion, params);
};

module.exports = {
    isConfigured,
    formatPhoneNumber,
    sendTemplateMessage,
    sendMessage,
    sendAdminAnnouncement,
    sendApplicationNotification,
    sendHiredNotification,
    sendJobSuggestion,
    sendWorkerSuggestion,
};
