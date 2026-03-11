const axios = require('axios');
const { translate } = require('google-translate-api-x');
const TranslationCache = require('../models/TranslationCache');

// Configuration
const LIBRETRANSLATE_API_URL = process.env.LIBRETRANSLATE_API_URL || 'https://libretranslate.com/translate';
const LIBRETRANSLATE_API_KEY = process.env.LIBRETRANSLATE_API_KEY || null;
const CACHE_ENABLED = process.env.TRANSLATION_CACHE_ENABLED !== 'false';
const PRIMARY_PROVIDER = process.env.TRANSLATION_PRIMARY_PROVIDER || 'google';
const FALLBACK_ENABLED = process.env.TRANSLATION_FALLBACK_ENABLED !== 'false';

// Supported languages mapping (ISO 639-1 codes)
const SUPPORTED_LANGUAGES = {
    en: 'en', // English
    hi: 'hi', // Hindi
    bn: 'bn', // Bengali
    te: 'te', // Telugu
    ta: 'ta', // Tamil
    mr: 'mr', // Marathi
    gu: 'gu', // Gujarati
    kn: 'kn', // Kannada
    ml: 'ml', // Malayalam
    pa: 'pa', // Punjabi
    or: 'or', // Odia
    as: 'as', // Assamese
};

/**
 * Translate text using Google Translate API
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code (default: 'en')
 * @returns {Promise<string>} Translated text
 */
async function translateWithGoogle(text, targetLang, sourceLang = 'en') {
    try {
        console.log(`[Google Translate] Translating: "${text.substring(0, 50)}..." from ${sourceLang} to ${targetLang}`);

        const result = await translate(text, { from: sourceLang, to: targetLang });

        console.log(`[Google Translate] Success: "${result.text.substring(0, 50)}..."`);
        return result.text;
    } catch (error) {
        console.error('[Google Translate] Error:', error.message);
        throw error;
    }
}

/**
 * Translate text using LibreTranslate API
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code (default: 'en')
 * @returns {Promise<string>} Translated text
 */
async function translateWithLibreTranslate(text, targetLang, sourceLang = 'en') {
    try {
        console.log(`[LibreTranslate] Translating: "${text.substring(0, 50)}..." from ${sourceLang} to ${targetLang}`);

        const requestBody = {
            q: text,
            source: sourceLang,
            target: targetLang,
            format: 'text',
        };

        // Add API key if available
        if (LIBRETRANSLATE_API_KEY) {
            requestBody.api_key = LIBRETRANSLATE_API_KEY;
        }

        const response = await axios.post(LIBRETRANSLATE_API_URL, requestBody, {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 10000, // 10 second timeout
        });

        const translatedText = response.data.translatedText;
        console.log(`[LibreTranslate] Success: "${translatedText.substring(0, 50)}..."`);

        return translatedText;
    } catch (error) {
        console.error('[LibreTranslate] Error:', error.message);
        if (error.response) {
            console.error('[LibreTranslate] API error:', error.response.data);
        }
        throw error;
    }
}

/**
 * Translate text with fallback mechanism
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code (default: 'en')
 * @returns {Promise<{text: string, provider: string}>} Translated text and provider used
 */
async function translateTextWithFallback(text, targetLang, sourceLang = 'en') {
    // Try primary provider (Google Translate)
    if (PRIMARY_PROVIDER === 'google') {
        try {
            const translatedText = await translateWithGoogle(text, targetLang, sourceLang);
            return { text: translatedText, provider: 'google' };
        } catch (error) {
            console.warn('[Translation] Google Translate failed, trying fallback...');

            // Try fallback (LibreTranslate)
            if (FALLBACK_ENABLED) {
                try {
                    const translatedText = await translateWithLibreTranslate(text, targetLang, sourceLang);
                    return { text: translatedText, provider: 'libretranslate' };
                } catch (fallbackError) {
                    console.warn(`[Translation] All providers failed for "${text.substring(0, 20)}...". Returning original.`);
                    return { text: text, provider: 'fallback_original' };
                }
            } else {
                console.warn(`[Translation] Google failed and fallback disabled. Returning original.`);
                return { text: text, provider: 'fallback_original' };
            }
        }
    } else {
        // Primary is LibreTranslate
        try {
            const translatedText = await translateWithLibreTranslate(text, targetLang, sourceLang);
            return { text: translatedText, provider: 'libretranslate' };
        } catch (error) {
            console.warn('[Translation] LibreTranslate failed, trying fallback...');

            // Try fallback (Google Translate)
            if (FALLBACK_ENABLED) {
                try {
                    const translatedText = await translateWithGoogle(text, targetLang, sourceLang);
                    return { text: translatedText, provider: 'google' };
                } catch (fallbackError) {
                    console.warn(`[Translation] All providers failed for "${text.substring(0, 20)}...". Returning original.`);
                    return { text: text, provider: 'fallback_original' };
                }
            } else {
                console.warn(`[Translation] LibreTranslate failed and fallback disabled. Returning original.`);
                return { text: text, provider: 'fallback_original' };
            }
        }
    }
}

/**
 * Translate text using dual-provider system with caching
 * @param {string} text - Text to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code (default: 'en')
 * @returns {Promise<string>} Translated text
 */
async function translateText(text, targetLang, sourceLang = 'en') {
    try {
        // Validate inputs
        if (!text || typeof text !== 'string' || text.trim() === '') {
            return text;
        }

        // If source and target are the same, return original text
        if (sourceLang === targetLang) {
            return text;
        }

        // Validate target language
        if (!SUPPORTED_LANGUAGES[targetLang]) {
            console.warn(`Unsupported target language: ${targetLang}. Returning original text.`);
            return text;
        }

        // Check cache first
        if (CACHE_ENABLED) {
            const cached = await getCachedTranslation(text, targetLang);
            if (cached) {
                console.log(`[Cache] Hit for: "${text.substring(0, 50)}..." -> ${targetLang} (provider: ${cached.provider}, hits: ${cached.hitCount})`);
                return cached.translatedText;
            }
            console.log(`[Cache] Miss for: "${text.substring(0, 50)}..." -> ${targetLang}`);
        }

        // Translate with fallback
        const { text: translatedText, provider } = await translateTextWithFallback(text, targetLang, sourceLang);

        // Cache the translation
        if (CACHE_ENABLED && translatedText) {
            await cacheTranslation(text, translatedText, sourceLang, targetLang, provider);
        }

        return translatedText;
    } catch (error) {
        console.error('[Translation] Error:', error.message);
        // If all fails, return original text
        return text;
    }
}

/**
 * Translate multiple texts in batch
 * @param {string[]} texts - Array of texts to translate
 * @param {string} targetLang - Target language code
 * @param {string} sourceLang - Source language code (default: 'en')
 * @returns {Promise<string[]>} Array of translated texts
 */
async function translateBatch(texts, targetLang, sourceLang = 'en') {
    try {
        const translations = await Promise.all(
            texts.map(text => translateText(text, targetLang, sourceLang))
        );
        return translations;
    } catch (error) {
        console.error('[Translation] Batch translation error:', error.message);
        return texts; // Return original texts on error
    }
}

/**
 * Get cached translation from MongoDB
 * @param {string} originalText - Original text
 * @param {string} targetLang - Target language code
 * @returns {Promise<Object|null>} Cached translation object or null
 */
async function getCachedTranslation(originalText, targetLang) {
    try {
        const cached = await TranslationCache.findOneAndUpdate(
            { originalText, targetLang },
            {
                $inc: { hitCount: 1 },
                $set: { lastAccessedAt: new Date() }
            },
            { new: true }
        );

        if (cached) {
            return {
                translatedText: cached.translatedText,
                provider: cached.provider,
                hitCount: cached.hitCount
            };
        }

        return null;
    } catch (error) {
        console.error('[Cache] Retrieval error:', error.message);
        return null;
    }
}

/**
 * Cache translation in MongoDB
 * @param {string} originalText - Original text
 * @param {string} translatedText - Translated text
 * @param {string} sourceLang - Source language code
 * @param {string} targetLang - Target language code
 * @param {string} provider - Provider used ('google' or 'libretranslate')
 */
async function cacheTranslation(originalText, translatedText, sourceLang, targetLang, provider) {
    try {
        await TranslationCache.findOneAndUpdate(
            { originalText, targetLang },
            {
                originalText,
                translatedText,
                sourceLang,
                targetLang,
                provider,
                hitCount: 0,
                lastAccessedAt: new Date(),
            },
            { upsert: true, new: true }
        );
        console.log(`[Cache] Stored: "${originalText.substring(0, 50)}..." -> ${targetLang} (provider: ${provider})`);
    } catch (error) {
        // Ignore cache errors, don't fail the translation
        console.error('[Cache] Storage error:', error.message);
    }
}

/**
 * Translate job object fields
 * @param {Object} job - Job object
 * @param {string} targetLang - Target language code
 * @returns {Promise<Object>} Job object with translated fields
 */
async function translateJob(job, targetLang) {
    try {
        if (!job || targetLang === 'en') {
            return job;
        }

        const jobObj = job.toObject ? job.toObject() : { ...job };

        // Translate title
        if (jobObj.title) {
            jobObj.title = await translateText(jobObj.title, targetLang);
        }

        // Translate description
        if (jobObj.description) {
            jobObj.description = await translateText(jobObj.description, targetLang);
        }

        // Translate skills array
        if (jobObj.skills && Array.isArray(jobObj.skills)) {
            jobObj.skills = await translateBatch(jobObj.skills, targetLang);
        }

        // Translate workerType array
        if (jobObj.workerType && Array.isArray(jobObj.workerType)) {
            jobObj.workerType = await translateBatch(jobObj.workerType, targetLang);
        }

        // Translate location address
        if (jobObj.location && jobObj.location.address) {
            jobObj.location.address = await translateText(jobObj.location.address, targetLang);
        }

        return jobObj;
    } catch (error) {
        console.error('[Translation] Job translation error:', error.message);
        return job; // Return original job on error
    }
}

/**
 * Translate message object
 * @param {Object} message - Message object
 * @param {string} targetLang - Target language code
 * @returns {Promise<Object>} Message object with translated text
 */
async function translateMessage(message, targetLang) {
    try {
        if (!message || targetLang === 'en') {
            return message;
        }

        const messageObj = message.toObject ? message.toObject() : { ...message };

        // Translate message text
        if (messageObj.text) {
            messageObj.text = await translateText(messageObj.text, targetLang);
        }

        return messageObj;
    } catch (error) {
        console.error('[Translation] Message translation error:', error.message);
        return message; // Return original message on error
    }
}

/**
 * Translate Notification object
 * @param {Object} notification - Notification object
 * @param {string} targetLang - Target language code
 * @returns {Promise<Object>} Notification object with translated text
 */
async function translateNotification(notification, targetLang) {
    try {
        if (!notification || targetLang === 'en') {
            return notification;
        }

        const notifObj = notification.toObject ? notification.toObject() : { ...notification };

        if (notifObj.title) {
            notifObj.title = await translateText(notifObj.title, targetLang);
        }
        if (notifObj.message) {
            notifObj.message = await translateText(notifObj.message, targetLang);
        }

        return notifObj;
    } catch (error) {
        console.error('[Translation] Notification translation error:', error.message);
        return notification;
    }
}

/**
 * Translate Rating object
 * @param {Object} rating - Rating object
 * @param {string} targetLang - Target language code
 * @returns {Promise<Object>} Rating object with translated text
 */
async function translateRating(rating, targetLang) {
    try {
        if (!rating || targetLang === 'en') {
            return rating;
        }

        const ratingObj = rating.toObject ? rating.toObject() : { ...rating };

        if (ratingObj.review) {
            ratingObj.review = await translateText(ratingObj.review, targetLang);
        }

        return ratingObj;
    } catch (error) {
        console.error('[Translation] Rating translation error:', error.message);
        return rating;
    }
}

/**
 * Translate WorkLog object
 * @param {Object} workLog - WorkLog object
 * @param {string} targetLang - Target language code
 * @returns {Promise<Object>} WorkLog object with translated text
 */
async function translateWorkLog(workLog, targetLang) {
    try {
        if (!workLog || targetLang === 'en') {
            return workLog;
        }

        const logObj = workLog.toObject ? workLog.toObject() : { ...workLog };

        if (logObj.startPhotoAddress) {
            logObj.startPhotoAddress = await translateText(logObj.startPhotoAddress, targetLang);
        }
        if (logObj.endPhotoAddress) {
            logObj.endPhotoAddress = await translateText(logObj.endPhotoAddress, targetLang);
        }

        // if job populated, translate
        if (logObj.job && typeof logObj.job === 'object' && logObj.job.title) {
            const translatedJob = await translateJob(logObj.job, targetLang);
            logObj.job = translatedJob;
        }

        return logObj;
    } catch (error) {
        console.error('[Translation] WorkLog translation error:', error.message);
        return workLog;
    }
}

/**
 * Translate User Profile
 * @param {Object} user - User profile object
 * @param {string} targetLang - Target language code
 * @returns {Promise<Object>} User object with translated text
 */
async function translateUser(user, targetLang) {
    try {
        if (!user || targetLang === 'en') {
            return user;
        }

        const userObj = user.toObject ? user.toObject() : { ...user };

        if (userObj.skills && Array.isArray(userObj.skills)) {
            userObj.skills = await translateBatch(userObj.skills, targetLang);
        }
        if (userObj.workerType && Array.isArray(userObj.workerType)) {
            userObj.workerType = await translateBatch(userObj.workerType, targetLang);
        }
        if (userObj.bio) {
            userObj.bio = await translateText(userObj.bio, targetLang);
        }
        if (userObj.locationName) {
            userObj.locationName = await translateText(userObj.locationName, targetLang);
        }

        // Preserve numeric values that might get lost in object spreading/translation rebuilding
        if (user.hourlyRate !== undefined) {
            userObj.hourlyRate = user.hourlyRate;
        }

        // Preserve arrays that aren't explicitly translated
        if (user.documents !== undefined) {
            userObj.documents = user.documents;
        }
        if (user.reviews !== undefined) {
            userObj.reviews = user.reviews;
            userObj.reviewCount = user.reviewCount;
        }

        if (userObj.companyDetails) {
            if (userObj.companyDetails.description) {
                userObj.companyDetails.description = await translateText(userObj.companyDetails.description, targetLang);
            }
        }

        return userObj;
    } catch (error) {
        console.error('[Translation] User Profile translation error:', error.message);
        return user;
    }
}

module.exports = {
    translateText,
    translateBatch,
    translateJob,
    translateMessage,
    translateNotification,
    translateRating,
    translateWorkLog,
    translateUser,
    SUPPORTED_LANGUAGES,
};
