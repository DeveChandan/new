const mongoose = require('mongoose');

/**
 * Performance monitoring middleware
 * Tracks API performance metrics
 */
class PerformanceMonitor {
    constructor() {
        this.metrics = {
            requests: {
                total: 0,
                success: 0,
                errors: 0,
                slow: 0, // >1000ms
            },
            endpoints: new Map(), // endpoint -> { count, avgDuration, errors }
            errors: [],
            slowQueries: [],
        };

        // Reset metrics every hour
        setInterval(() => this.resetHourlyMetrics(), 60 * 60 * 1000);
    }

    /**
     * Track request
     */
    trackRequest(req, res, duration) {
        this.metrics.requests.total++;

        if (res.statusCode >= 200 && res.statusCode < 400) {
            this.metrics.requests.success++;
        } else if (res.statusCode >= 400) {
            this.metrics.requests.errors++;
        }

        if (duration > 1000) {
            this.metrics.requests.slow++;
            this.trackSlowQuery(req, duration);
        }

        this.trackEndpoint(req.method, req.originalUrl, duration, res.statusCode);
    }

    /**
     * Track endpoint performance
     */
    trackEndpoint(method, url, duration, statusCode) {
        const key = `${method} ${url}`;

        if (!this.metrics.endpoints.has(key)) {
            this.metrics.endpoints.set(key, {
                count: 0,
                totalDuration: 0,
                avgDuration: 0,
                errors: 0,
                lastCalled: new Date(),
            });
        }

        const endpoint = this.metrics.endpoints.get(key);
        endpoint.count++;
        endpoint.totalDuration += duration;
        endpoint.avgDuration = Math.round(endpoint.totalDuration / endpoint.count);
        endpoint.lastCalled = new Date();

        if (statusCode >= 400) {
            endpoint.errors++;
        }
    }

    /**
     * Track slow query
     */
    trackSlowQuery(req, duration) {
        this.metrics.slowQueries.push({
            method: req.method,
            url: req.originalUrl,
            duration,
            timestamp: new Date(),
            ip: req.ip,
        });

        // Keep only last 50 slow queries
        if (this.metrics.slowQueries.length > 50) {
            this.metrics.slowQueries.shift();
        }
    }

    /**
     * Track error
     */
    trackError(error, req) {
        this.metrics.errors.push({
            message: error.message,
            stack: error.stack,
            url: req?.originalUrl,
            method: req?.method,
            timestamp: new Date(),
        });

        // Keep only last 100 errors
        if (this.metrics.errors.length > 100) {
            this.metrics.errors.shift();
        }
    }

    /**
     * Get metrics summary
     */
    getMetrics() {
        const topEndpoints = Array.from(this.metrics.endpoints.entries())
            .sort((a, b) => b[1].count - a[1].count)
            .slice(0, 10)
            .map(([endpoint, stats]) => ({
                endpoint,
                ...stats,
            }));

        const slowestEndpoints = Array.from(this.metrics.endpoints.entries())
            .sort((a, b) => b[1].avgDuration - a[1].avgDuration)
            .slice(0, 10)
            .map(([endpoint, stats]) => ({
                endpoint,
                ...stats,
            }));

        return {
            summary: {
                ...this.metrics.requests,
                errorRate: this.metrics.requests.total > 0
                    ? ((this.metrics.requests.errors / this.metrics.requests.total) * 100).toFixed(2) + '%'
                    : '0%',
                slowRate: this.metrics.requests.total > 0
                    ? ((this.metrics.requests.slow / this.metrics.requests.total) * 100).toFixed(2) + '%'
                    : '0%',
            },
            topEndpoints,
            slowestEndpoints,
            recentErrors: this.metrics.errors.slice(-10),
            recentSlowQueries: this.metrics.slowQueries.slice(-10),
            database: this.getDatabaseStats(),
            system: this.getSystemStats(),
        };
    }

    /**
     * Get database statistics
     */
    getDatabaseStats() {
        const state = mongoose.connection.readyState;
        const states = ['disconnected', 'connected', 'connecting', 'disconnecting'];

        return {
            status: states[state] || 'unknown',
            host: mongoose.connection.host,
            name: mongoose.connection.name,
        };
    }

    /**
     * Get system statistics
     */
    getSystemStats() {
        const used = process.memoryUsage();

        return {
            uptime: process.uptime(),
            memory: {
                rss: Math.round(used.rss / 1024 / 1024) + ' MB',
                heapTotal: Math.round(used.heapTotal / 1024 / 1024) + ' MB',
                heapUsed: Math.round(used.heapUsed / 1024 / 1024) + ' MB',
                external: Math.round(used.external / 1024 / 1024) + ' MB',
            },
            cpu: process.cpuUsage(),
            nodeVersion: process.version,
            platform: process.platform,
        };
    }

    /**
     * Reset hourly metrics
     */
    resetHourlyMetrics() {
        console.log('📊 Hourly Metrics Summary:', {
            requests: this.metrics.requests,
            topEndpoints: Array.from(this.metrics.endpoints.entries())
                .sort((a, b) => b[1].count - a[1].count)
                .slice(0, 5)
                .map(([endpoint, stats]) => ({ endpoint, count: stats.count })),
        });

        // Reset counters but keep endpoint history
        this.metrics.requests = {
            total: 0,
            success: 0,
            errors: 0,
            slow: 0,
        };
    }
}

// Create singleton instance
const monitor = new PerformanceMonitor();

/**
 * Express middleware for performance monitoring
 */
const performanceMonitoring = (req, res, next) => {
    const start = Date.now();

    // Track response
    res.on('finish', () => {
        const duration = Date.now() - start;
        monitor.trackRequest(req, res, duration);
    });

    next();
};

/**
 * Get monitoring metrics
 */
const getMetrics = () => {
    return monitor.getMetrics();
};

/**
 * Track error
 */
const trackError = (error, req) => {
    monitor.trackError(error, req);
};

module.exports = {
    performanceMonitoring,
    getMetrics,
    trackError,
};
