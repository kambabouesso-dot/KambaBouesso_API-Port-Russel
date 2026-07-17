const User = require('../models/user');
const mongoose = require('mongoose');

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

function sanitizeUser(userDoc) {
    if (!userDoc) {
        return null;
    }

    const user = userDoc.toObject ? userDoc.toObject() : userDoc;
    delete user.password;
    return user;
}

function getAllowedUpdatePayload(body) {
    const payload = {};
    const allowedFields = ['name', 'email', 'password'];

    allowedFields.forEach((field) => {
        const value = body[field];

        if (typeof value === 'string' && value.trim()) {
            payload[field] = value.trim();
        }
    });

    if (payload.email) {
        payload.email = payload.email.toLowerCase();
    }

    return payload;
}

function handleWriteError(error, res) {
    if (error && error.code === 11000) {
        return res.status(409).json({
            status: 409,
            error: 'conflict',
            message: 'Cet email est deja utilise'
        });
    }

    return res.status(500).json({
        status: 500,
        error: 'internal_error',
        message: 'Erreur interne serveur'
    });
}

exports.getAll = async (req, res) => {
    try {
        // On exclut le hash de mot de passe de la liste renvoyee.
        const users = await User.find().select('-password').sort({ createdAt: -1 });
        return res.status(200).json(users);
    } catch (error) {
        return res.status(500).json({
            status: 500,
            error: 'internal_error',
            message: 'Erreur interne serveur'
        });
    }
};

exports.getById = async (req, res, next) => {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
        return res.status(400).json({
            status: 400,
            error: 'bad_request',
            message: 'Identifiant utilisateur invalide'
        });
    }

    try {
        let user = await User.findById(id).select('-password');

        if (user) {
            return res.status(200).json(user);
        }
        return res.status(404).json({
            status: 404,
            error: 'not_found',
            message: 'Utilisateur introuvable'
        });
    } catch (error) {
        return res.status(500).json({
            status: 500,
            error: 'internal_error',
            message: 'Erreur interne serveur'
        });
    }
};

exports.create = async (req, res, next) => {
    const { name, email, password } = req.body;

    // Validation minimale de la phase 1 pour eviter les creations invalides.
    if (!name || !email || !password) {
        return res.status(400).json({
            status: 400,
            error: 'bad_request',
            message: 'name, email et password sont requis'
        });
    }

    const temp = ({
        name: String(name).trim(),
        email: String(email).trim().toLowerCase(),
        password: String(password)
    });

    try {
        let user = await User.create(temp);

        return res.status(201).json(sanitizeUser(user));
    } catch (error) {
        return handleWriteError(error, res);
    }
};

exports.update = async (req, res, next) => {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
        return res.status(400).json({
            status: 400,
            error: 'bad_request',
            message: 'Identifiant utilisateur invalide'
        });
    }

    // On n'accepte que les champs explicitement autorises.
    const temp = getAllowedUpdatePayload(req.body);

    if (!Object.keys(temp).length) {
        return res.status(400).json({
            status: 400,
            error: 'bad_request',
            message: 'Aucun champ modifiable fourni'
        });
    }

    try {
        let user = await User.findOne({ _id: id });
        
        if (user) {
            Object.keys(temp).forEach((key) => {
                if (!!temp[key]) {
                    user[key] = temp[key];
                }
            });

            await user.save();
            return res.status(200).json(sanitizeUser(user));
        }

        return res.status(404).json({
            status: 404,
            error: 'not_found',
            message: 'Utilisateur introuvable'
        });
    } catch (error) {
        return handleWriteError(error, res);
    }
};

exports.delete = async (req, res, next) => {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
        return res.status(400).json({
            status: 400,
            error: 'bad_request',
            message: 'Identifiant utilisateur invalide'
        });
    }

    try {
        const deletedUser = await User.findByIdAndDelete(id);

        if (!deletedUser) {
            return res.status(404).json({
                status: 404,
                error: 'not_found',
                message: 'Utilisateur introuvable'
            });
        }

        return res.status(204).send();
    } catch (error) {
        return res.status(500).json({
            status: 500,
            error: 'internal_error',
            message: 'Erreur interne serveur'
        });
    }
};
        