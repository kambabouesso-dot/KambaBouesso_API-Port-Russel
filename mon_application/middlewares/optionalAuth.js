const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return next();
    }

    const token = authHeader.split(' ')[1];
    const secret = process.env.JWT_SECRET;

    if (!secret) {
        return next();
    }

    try {
        const verifyOptions = {
            issuer: process.env.APP_NAME || 'mon_application'
        };
        const audience = process.env.JWT_AUDIENCE;

        if (audience) {
            verifyOptions.audience = audience;
        }

        req.auth = jwt.verify(token, secret, verifyOptions);
    } catch (error) {
        // Route publique: un token invalide ne bloque pas la requete,
        // mais ne donne aucun privilege supplementaire.
    }

    return next();
};