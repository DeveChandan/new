const Setting = require('../models/Setting');

const DEFAULT_APP_VERSION_CONFIG = {
    android: {
        latestVersion: '1.0.1',
        latestVersionCode: 4,
        minRequiredVersion: '1.0.0',
        minRequiredVersionCode: 3,
        forceUpdate: false,
        storeUrl: 'https://play.google.com/store/apps/details?id=com.shramikseva.app',
        marketUrl: 'market://details?id=com.shramikseva.app',
        title: 'New Update Available 🎉',
        message: 'A newer, faster version of Shramik Seva is available on the Google Play Store.',
        releaseNotes: [
            'Dynamic rate limit & security controls',
            'Instant subscription payment reconciliation',
            'Performance improvements and smoother navigation',
            'Stability and bug fixes'
        ]
    },
    ios: {
        latestVersion: '1.0.1',
        latestVersionCode: 4,
        minRequiredVersion: '1.0.0',
        minRequiredVersionCode: 3,
        forceUpdate: false,
        storeUrl: 'https://apps.apple.com/app/shramik-seva/id000000000',
        marketUrl: 'itms-apps://itunes.apple.com/app/id000000000',
        title: 'New Update Available 🎉',
        message: 'A newer version of Shramik Seva is available on the App Store.',
        releaseNotes: [
            'Performance improvements',
            'Bug fixes and enhancements'
        ]
    }
};

/**
 * Compare two semantic version strings (e.g. "1.0.0" vs "1.0.1")
 * Returns:
 * -1 if v1 < v2
 *  0 if v1 === v2
 *  1 if v1 > v2
 */
function compareSemver(v1, v2) {
    if (!v1 && !v2) return 0;
    if (!v1) return -1;
    if (!v2) return 1;

    const p1 = String(v1).replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
    const p2 = String(v2).replace(/^v/i, '').split('.').map(n => parseInt(n, 10) || 0);
    const maxLen = Math.max(p1.length, p2.length);

    for (let i = 0; i < maxLen; i++) {
        const num1 = p1[i] || 0;
        const num2 = p2[i] || 0;
        if (num1 > num2) return 1;
        if (num1 < num2) return -1;
    }
    return 0;
}

/**
 * Get active app version configuration from MongoDB or fallback to defaults
 */
async function getActiveConfig() {
    try {
        const setting = await Setting.findOne({ key: 'app_version_config' });
        if (setting && setting.value) {
            return {
                android: { ...DEFAULT_APP_VERSION_CONFIG.android, ...setting.value.android },
                ios: { ...DEFAULT_APP_VERSION_CONFIG.ios, ...setting.value.ios }
            };
        }
    } catch (err) {
        console.error('[AppVersion] Error loading version config from DB:', err.message);
    }
    return DEFAULT_APP_VERSION_CONFIG;
}

/**
 * Check if an update is available for mobile clients
 * GET /api/app-version/check?platform=android&currentVersion=1.0.0&currentBuild=3
 */
const checkAppVersion = async (req, res) => {
    try {
        const platform = (req.query.platform || 'android').toLowerCase();
        const currentVersion = req.query.currentVersion || '1.0.0';
        const currentBuild = parseInt(req.query.currentBuild || req.query.versionCode || '0', 10);

        const allConfig = await getActiveConfig();
        const config = allConfig[platform] || allConfig.android;

        // Check if an update is available (either higher build code or higher semver)
        let isUpdateAvailable = false;
        if (currentBuild > 0 && config.latestVersionCode > 0) {
            isUpdateAvailable = currentBuild < config.latestVersionCode;
        } else {
            isUpdateAvailable = compareSemver(currentVersion, config.latestVersion) < 0;
        }

        // Check if mandatory / force update is required
        let isForceUpdate = false;
        if (config.forceUpdate) {
            isForceUpdate = true;
        } else if (currentBuild > 0 && config.minRequiredVersionCode > 0) {
            isForceUpdate = currentBuild < config.minRequiredVersionCode;
        } else {
            isForceUpdate = compareSemver(currentVersion, config.minRequiredVersion) < 0;
        }

        return res.status(200).json({
            success: true,
            updateAvailable: isUpdateAvailable,
            forceUpdate: isForceUpdate,
            platform,
            currentVersion,
            currentBuild,
            latestVersion: config.latestVersion,
            latestVersionCode: config.latestVersionCode,
            minRequiredVersion: config.minRequiredVersion,
            minRequiredVersionCode: config.minRequiredVersionCode,
            title: config.title,
            message: config.message,
            releaseNotes: config.releaseNotes || [],
            storeUrl: config.storeUrl,
            marketUrl: config.marketUrl
        });
    } catch (error) {
        console.error('[AppVersion] Error checking app version:', error);
        return res.status(500).json({
            success: false,
            message: error.message || 'Failed to check app version'
        });
    }
};

/**
 * Get full app version configuration (Admin)
 * GET /api/app-version/config
 */
const getAppVersionConfig = async (req, res) => {
    try {
        const config = await getActiveConfig();
        return res.status(200).json({
            success: true,
            config
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

/**
 * Update app version configuration (Admin)
 * PUT /api/app-version/config
 */
const updateAppVersionConfig = async (req, res) => {
    try {
        const { android, ios } = req.body;

        const currentConfig = await getActiveConfig();
        const updatedConfig = {
            android: { ...currentConfig.android, ...android },
            ios: { ...currentConfig.ios, ...ios }
        };

        await Setting.findOneAndUpdate(
            { key: 'app_version_config' },
            {
                key: 'app_version_config',
                value: updatedConfig,
                description: 'Mobile App Version and Play Store Update Configuration'
            },
            { upsert: true, new: true }
        );

        return res.status(200).json({
            success: true,
            message: 'App version configuration updated successfully',
            config: updatedConfig
        });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message
        });
    }
};

module.exports = {
    checkAppVersion,
    getAppVersionConfig,
    updateAppVersionConfig,
    compareSemver
};
