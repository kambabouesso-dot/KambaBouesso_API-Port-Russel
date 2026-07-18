const fs = require('fs/promises');
const path = require('path');

const Catway = require('../models/catway');

const CATWAYS_FILE_PATH = path.resolve(__dirname, '..', '..', 'catways.json');
let bootstrapPromise = null;

function parseCatwayNumber(value) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        return null;
    }
    return parsed;
}

function buildPayload(body) {
    const payload = {};

    if (typeof body.catwayNumber !== 'undefined') {
        payload.catwayNumber = parseCatwayNumber(body.catwayNumber);
    }
    if (typeof body.catwayType === 'string' && body.catwayType.trim()) {
        payload.catwayType = body.catwayType.trim().toLowerCase();
    }
    if (typeof body.catwayState === 'string' && body.catwayState.trim()) {
        payload.catwayState = body.catwayState.trim();
    }

    return payload;
}

function mapError(error, res) {
    if (error && error.code === 11000) {
        return res.status(409).json({
            status: 409,
            error: 'conflict',
            message: 'Ce numero de catway existe deja'
        });
    }

    return res.status(500).json({
        status: 500,
        error: 'internal_error',
        message: 'Erreur interne serveur'
    });
}

async function bootstrapFromJsonIfNeeded() {
    const count = await Catway.countDocuments();
    if (count > 0) {
        return;
    }

    const raw = await fs.readFile(CATWAYS_FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
        throw new Error('catways.json doit contenir un tableau');
    }

    // On charge le jeu initial depuis catways.json sans modifier le fichier source.
    await Catway.insertMany(parsed, { ordered: false });
}

async function ensureCatwaysReady() {
    if (!bootstrapPromise) {
        bootstrapPromise = bootstrapFromJsonIfNeeded().catch((error) => {
            bootstrapPromise = null;
            throw error;
        });
    }

    return bootstrapPromise;
}

exports.getAll = async (req, res) => {
    try {
        await ensureCatwaysReady();
        const catways = await Catway.find().sort({ catwayNumber: 1 });
        return res.status(200).json(catways);
    } catch (error) {
        return mapError(error, res);
    }
};

exports.getByNumber = async (req, res) => {
    const catwayNumber = parseCatwayNumber(req.params.catwayNumber);

    if (!catwayNumber) {
        return res.status(400).json({
            status: 400,
            error: 'bad_request',
            message: 'Numero de catway invalide'
        });
    }

    try {
        await ensureCatwaysReady();
        const catway = await Catway.findOne({ catwayNumber });

        if (!catway) {
            return res.status(404).json({
                status: 404,
                error: 'not_found',
                message: 'Catway introuvable'
            });
        }

        return res.status(200).json(catway);
    } catch (error) {
        return mapError(error, res);
    }
};

exports.create = async (req, res) => {
    const payload = buildPayload(req.body);

    if (!payload.catwayNumber || !payload.catwayType || !payload.catwayState) {
        return res.status(400).json({
            status: 400,
            error: 'bad_request',
            message: 'catwayNumber, catwayType et catwayState sont requis'
        });
    }

    try {
        await ensureCatwaysReady();
        const created = await Catway.create(payload);
        return res.status(201).json(created);
    } catch (error) {
        return mapError(error, res);
    }
};

exports.update = async (req, res) => {
    const catwayNumber = parseCatwayNumber(req.params.catwayNumber);

    if (!catwayNumber) {
        return res.status(400).json({
            status: 400,
            error: 'bad_request',
            message: 'Numero de catway invalide'
        });
    }

    const payload = buildPayload(req.body);

    // On interdit la modification du numero pour conserver l'identite metier.
    delete payload.catwayNumber;

    if (!Object.keys(payload).length) {
        return res.status(400).json({
            status: 400,
            error: 'bad_request',
            message: 'Aucun champ modifiable fourni'
        });
    }

    try {
        await ensureCatwaysReady();
        const catway = await Catway.findOne({ catwayNumber });

        if (!catway) {
            return res.status(404).json({
                status: 404,
                error: 'not_found',
                message: 'Catway introuvable'
            });
        }

        Object.keys(payload).forEach((key) => {
            catway[key] = payload[key];
        });

        await catway.save();
        return res.status(200).json(catway);
    } catch (error) {
        return mapError(error, res);
    }
};

exports.remove = async (req, res) => {
    const catwayNumber = parseCatwayNumber(req.params.catwayNumber);

    if (!catwayNumber) {
        return res.status(400).json({
            status: 400,
            error: 'bad_request',
            message: 'Numero de catway invalide'
        });
    }

    try {
        await ensureCatwaysReady();
        const deleted = await Catway.findOneAndDelete({ catwayNumber });

        if (!deleted) {
            return res.status(404).json({
                status: 404,
                error: 'not_found',
                message: 'Catway introuvable'
            });
        }

        return res.status(204).send();
    } catch (error) {
        return mapError(error, res);
    }
};
