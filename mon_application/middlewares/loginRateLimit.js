const attemptsStore = new Map();

function getClientIp(req) {
    const forwarded = req.headers['x-forwarded-for'];
    if (typeof forwarded === 'string' && forwarded.length > 0) {
        return forwarded.split(',')[0].trim();
    }

    return req.ip || req.connection.remoteAddress || 'unknown';
}

function normalizeIdentity(req) {
    const email = req.body && typeof req.body.email === 'string'
        ? req.body.email.trim().toLowerCase()
        : 'unknown-email';

    return getClientIp(req) + '|' + email;
}

function cleanupExpiredBuckets(now) {
    attemptsStore.forEach((bucket, key) => {
        if (now > bucket.resetAt) {
            attemptsStore.delete(key);
        }
    });
}

module.exports = (req, res, next) => {
    const maxAttempts = Number(process.env.LOGIN_RATE_LIMIT_MAX_ATTEMPTS || 5);
    const windowMs = Number(process.env.LOGIN_RATE_LIMIT_WINDOW_MS || 10 * 60 * 1000);
    const now = Date.now();

    cleanupExpiredBuckets(now);

    const key = normalizeIdentity(req);
    const bucket = attemptsStore.get(key);

    if (!bucket || now > bucket.resetAt) {
        attemptsStore.set(key, {
            count: 1,
            resetAt: now + windowMs
        });
        return next();
    }

    if (bucket.count >= maxAttempts) {
        return res.status(429).json({
            status: 429,
            error: 'too_many_requests',
            message: 'Trop de tentatives de connexion. Reessayez plus tard.'
        });
    }

    bucket.count += 1;
    attemptsStore.set(key, bucket);
    return next();
};
