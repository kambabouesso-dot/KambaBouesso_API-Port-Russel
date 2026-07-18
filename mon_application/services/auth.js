const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const User = require('../models/user');

function sanitizeUser(userDoc) {
    const user = userDoc.toObject ? userDoc.toObject() : userDoc;
    delete user.password;
    return user;
}

exports.login = async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({
            status: 400,
            error: 'bad_request',
            message: 'email et password sont requis'
        });
    }

    const jwtSecret = process.env.JWT_SECRET;
    const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '2h';

    if (!jwtSecret) {
        return res.status(500).json({
            status: 500,
            error: 'config_error',
            message: 'JWT_SECRET est manquant dans la configuration'
        });
    }

    try {
        const normalizedEmail = String(email).trim().toLowerCase();
        const user = await User.findOne({ email: normalizedEmail });

        // Message volontairement neutre pour ne pas reveler l'existence d'un compte.
        if (!user) {
            return res.status(401).json({
                status: 401,
                error: 'unauthorized',
                message: 'Identifiants invalides'
            });
        }

        const isValidPassword = await bcrypt.compare(String(password), user.password);

        if (!isValidPassword) {
            return res.status(401).json({
                status: 401,
                error: 'unauthorized',
                message: 'Identifiants invalides'
            });
        }

        const tokenPayload = {
            sub: user._id.toString(),
            email: user.email,
            name: user.name
        };

        const token = jwt.sign(tokenPayload, jwtSecret, {
            expiresIn: jwtExpiresIn,
            issuer: process.env.APP_NAME || 'mon_application'
        });

        return res.status(200).json({
            token,
            tokenType: 'Bearer',
            expiresIn: jwtExpiresIn,
            user: sanitizeUser(user)
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            error: 'internal_error',
            message: 'Erreur interne serveur'
        });
    }
};
