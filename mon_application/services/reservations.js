const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');

const Reservation = require('../models/reservation');

const RESERVATIONS_FILE_PATH = path.resolve(__dirname, '..', '..', 'reservations.json');
let bootstrapPromise = null;

function isValidObjectId(id) {
    return mongoose.Types.ObjectId.isValid(id);
}

function parseCatwayNumber(value) {
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) {
        return null;
    }
    return parsed;
}

function parseDate(value) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
        return null;
    }
    return date;
}

function mapError(error, res) {
    if (error && error.name === 'ValidationError') {
        return res.status(400).json({
            status: 400,
            error: 'bad_request',
            message: error.message
        });
    }

    return res.status(500).json({
        status: 500,
        error: 'internal_error',
        message: 'Erreur interne serveur'
    });
}

function buildPayload(body) {
    const payload = {};

    if (typeof body.catwayNumber !== 'undefined') {
        payload.catwayNumber = parseCatwayNumber(body.catwayNumber);
    }
    if (typeof body.clientName === 'string' && body.clientName.trim()) {
        payload.clientName = body.clientName.trim();
    }
    if (typeof body.boatName === 'string' && body.boatName.trim()) {
        payload.boatName = body.boatName.trim();
    }
    if (typeof body.startDate !== 'undefined') {
        payload.startDate = parseDate(body.startDate);
    }
    if (typeof body.endDate !== 'undefined') {
        payload.endDate = parseDate(body.endDate);
    }

    return payload;
}

function validatePeriod(startDate, endDate, res) {
    if (!startDate || !endDate) {
        res.status(400).json({
            status: 400,
            error: 'bad_request',
            message: 'startDate et endDate sont requis et doivent etre valides'
        });
        return false;
    }

    if (endDate <= startDate) {
        res.status(400).json({
            status: 400,
            error: 'bad_request',
            message: 'endDate doit etre strictement superieure a startDate'
        });
        return false;
    }

    return true;
}

async function assertNoOverlap({ catwayNumber, startDate, endDate, excludeId, res }) {
    const overlapQuery = {
        catwayNumber,
        startDate: { $lt: endDate },
        endDate: { $gt: startDate }
    };

    if (excludeId) {
        overlapQuery._id = { $ne: excludeId };
    }

    const existing = await Reservation.findOne(overlapQuery);
    if (existing) {
        res.status(409).json({
            status: 409,
            error: 'conflict',
            message: 'Ce catway est deja reserve sur cette periode'
        });
        return false;
    }

    return true;
}

async function bootstrapFromJsonIfNeeded() {
    const count = await Reservation.countDocuments();
    if (count > 0) {
        return;
    }

    const raw = await fs.readFile(RESERVATIONS_FILE_PATH, 'utf8');
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
        throw new Error('reservations.json doit contenir un tableau');
    }

    // Le fichier reservations.json est utilise en lecture seule comme jeu initial.
    const normalized = parsed.map((item) => ({
        catwayNumber: parseCatwayNumber(item.catwayNumber),
        clientName: item.clientName,
        boatName: item.boatName,
        startDate: parseDate(item.startDate),
        endDate: parseDate(item.endDate)
    }));

    await Reservation.insertMany(normalized, { ordered: false });
}

async function ensureReservationsReady() {
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
        await ensureReservationsReady();
        const reservations = await Reservation.find().sort({ startDate: 1 });
        return res.status(200).json(reservations);
    } catch (error) {
        return mapError(error, res);
    }
};

exports.getByCatwayNumber = async (req, res) => {
    const catwayNumber = parseCatwayNumber(req.params.catwayNumber);

    if (!catwayNumber) {
        return res.status(400).json({
            status: 400,
            error: 'bad_request',
            message: 'Numero de catway invalide'
        });
    }

    try {
        await ensureReservationsReady();
        const reservations = await Reservation.find({ catwayNumber }).sort({ startDate: 1 });
        return res.status(200).json(reservations);
    } catch (error) {
        return mapError(error, res);
    }
};

exports.getById = async (req, res) => {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
        return res.status(400).json({
            status: 400,
            error: 'bad_request',
            message: 'Identifiant reservation invalide'
        });
    }

    try {
        await ensureReservationsReady();
        const reservation = await Reservation.findById(id);

        if (!reservation) {
            return res.status(404).json({
                status: 404,
                error: 'not_found',
                message: 'Reservation introuvable'
            });
        }

        return res.status(200).json(reservation);
    } catch (error) {
        return mapError(error, res);
    }
};

exports.create = async (req, res) => {
    const payload = buildPayload(req.body);

    if (!payload.catwayNumber || !payload.clientName || !payload.boatName) {
        return res.status(400).json({
            status: 400,
            error: 'bad_request',
            message: 'catwayNumber, clientName et boatName sont requis'
        });
    }

    if (!validatePeriod(payload.startDate, payload.endDate, res)) {
        return;
    }

    try {
        await ensureReservationsReady();

        const noOverlap = await assertNoOverlap({
            catwayNumber: payload.catwayNumber,
            startDate: payload.startDate,
            endDate: payload.endDate,
            res
        });

        if (!noOverlap) {
            return;
        }

        const created = await Reservation.create(payload);
        return res.status(201).json(created);
    } catch (error) {
        return mapError(error, res);
    }
};

exports.update = async (req, res) => {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
        return res.status(400).json({
            status: 400,
            error: 'bad_request',
            message: 'Identifiant reservation invalide'
        });
    }

    const payload = buildPayload(req.body);

    if (!Object.keys(payload).length) {
        return res.status(400).json({
            status: 400,
            error: 'bad_request',
            message: 'Aucun champ modifiable fourni'
        });
    }

    try {
        await ensureReservationsReady();
        const reservation = await Reservation.findById(id);

        if (!reservation) {
            return res.status(404).json({
                status: 404,
                error: 'not_found',
                message: 'Reservation introuvable'
            });
        }

        const nextCatwayNumber = payload.catwayNumber || reservation.catwayNumber;
        const nextStartDate = payload.startDate || reservation.startDate;
        const nextEndDate = payload.endDate || reservation.endDate;

        if (!validatePeriod(nextStartDate, nextEndDate, res)) {
            return;
        }

        const noOverlap = await assertNoOverlap({
            catwayNumber: nextCatwayNumber,
            startDate: nextStartDate,
            endDate: nextEndDate,
            excludeId: reservation._id,
            res
        });

        if (!noOverlap) {
            return;
        }

        Object.keys(payload).forEach((key) => {
            reservation[key] = payload[key];
        });

        await reservation.save();
        return res.status(200).json(reservation);
    } catch (error) {
        return mapError(error, res);
    }
};

exports.remove = async (req, res) => {
    const id = req.params.id;

    if (!isValidObjectId(id)) {
        return res.status(400).json({
            status: 400,
            error: 'bad_request',
            message: 'Identifiant reservation invalide'
        });
    }

    try {
        await ensureReservationsReady();
        const deleted = await Reservation.findByIdAndDelete(id);

        if (!deleted) {
            return res.status(404).json({
                status: 404,
                error: 'not_found',
                message: 'Reservation introuvable'
            });
        }

        return res.status(204).send();
    } catch (error) {
        return mapError(error, res);
    }
};
