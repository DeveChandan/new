const { translateText, translateBatch } = require('../services/translationService');

const translateContent = async (req, res) => {
    try {
        const { text, texts, sourceLang = 'en', targetLang } = req.body;

        if (!targetLang) {
            return res.status(400).json({ message: 'Target language (targetLang) is required' });
        }

        if (texts && Array.isArray(texts)) {
            const translatedTexts = await translateBatch(texts, targetLang, sourceLang);
            return res.status(200).json({ translations: translatedTexts });
        } else if (text) {
            const translatedText = await translateText(text, targetLang, sourceLang);
            return res.status(200).json({ translation: translatedText });
        } else {
            return res.status(400).json({ message: 'Must provide either text or texts array' });
        }
    } catch (error) {
        console.error('Translation error:', error);
        res.status(500).json({ message: 'Failed to translate content' });
    }
};

module.exports = {
    translateContent
};
