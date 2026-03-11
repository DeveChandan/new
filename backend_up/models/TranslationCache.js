const mongoose = require('mongoose');

const translationCacheSchema = new mongoose.Schema(
    {
        originalText: {
            type: String,
            required: true,
            index: true,
        },
        translatedText: {
            type: String,
            required: true,
        },
        sourceLang: {
            type: String,
            required: true,
            default: 'en',
        },
        targetLang: {
            type: String,
            required: true,
            index: true,
        },
        provider: {
            type: String,
            enum: ['google', 'libretranslate'],
            default: 'google',
        },
        hitCount: {
            type: Number,
            default: 0,
        },
        lastAccessedAt: {
            type: Date,
            default: Date.now,
        },
        createdAt: {
            type: Date,
            default: Date.now,
            // TTL index - automatically delete documents after 30 days
            expires: 30 * 24 * 60 * 60, // 30 days in seconds
        },
    },
    {
        timestamps: true,
    }
);

// Compound index for fast lookups
translationCacheSchema.index({ originalText: 1, targetLang: 1 }, { unique: true });

const TranslationCache = mongoose.model('TranslationCache', translationCacheSchema);

module.exports = TranslationCache;
