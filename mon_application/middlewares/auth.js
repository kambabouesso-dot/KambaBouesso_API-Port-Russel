const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({
            status: 401,
            error: 'unauthorized',
            message: 'Token Bearer manquant'
        });
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;
    const issuer = process.env.APP_NAME || 'mon_application';
    const audience = process.env.JWT_AUDIENCE;

    if (!secret) {
        return res.status(500).json({
            status: 500,
            error: 'config_error',
            message: 'Configuration JWT manquante'
        });
    }

    try {
        // Le payload decode est conserve pour un controle d'acces ulterieur.
        const verifyOptions = {
            issuer
        };

        if (audience) {
            verifyOptions.audience = audience;
        }

        const decoded = jwt.verify(token, secret, verifyOptions);
        req.auth = decoded;
        return next();
    } catch (error) {
        const message = error.name === 'TokenExpiredError'
            ? 'Token expire'
            : 'Token invalide';

        return res.status(401).json({
            status: 401,
            error: 'unauthorized',
            message
        });
    }
};
