const fs = require('fs/promises');
const path = require('path');
const mongoose = require('mongoose');

const mongo = require('../db/mongo');
const Catway = require('../models/catway');
const Reservation = require('../models/reservation');

const CATWAYS_FILE_PATH = path.resolve(__dirname, '..', '..', 'catways.json');
const RESERVATIONS_FILE_PATH = path.resolve(__dirname, '..', '..', 'reservations.json');

function parseMode(argv) {
    if (argv.includes('--catways')) {
        return 'catways';
    }
    if (argv.includes('--reservations')) {
        return 'reservations';
    }
    return 'all';
}

async function readJsonArray(filePath, label) {
    const raw = await fs.readFile(filePath, 'utf8');
    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
        throw new Error(label + ' doit contenir un tableau JSON');
    }

    return parsed;
}

async function seedCatways() {
    const rows = await readJsonArray(CATWAYS_FILE_PATH, 'catways.json');

    const operations = rows
        .filter((row) => Number.isInteger(row.catwayNumber) && row.catwayNumber > 0)
        .map((row) => ({
            updateOne: {
                filter: { catwayNumber: row.catwayNumber },
                update: {
                    $set: {
                        catwayType: String(row.catwayType || '').trim().toLowerCase(),
                        catwayState: String(row.catwayState || '').trim()
                    },
                    $setOnInsert: {
                        catwayNumber: row.catwayNumber
                    }
                },
                upsert: true
            }
        }));

    if (!operations.length) {
        return { total: 0, inserted: 0, updated: 0 };
    }

    const result = await Catway.bulkWrite(operations, { ordered: false });
    return {
        total: operations.length,
        inserted: result.upsertedCount || 0,
        updated: result.modifiedCount || 0
    };
}

async function seedReservations() {
    const rows = await readJsonArray(RESERVATIONS_FILE_PATH, 'reservations.json');

    // On ne seed que les reservations qui pointent vers un catway existant en base.
    const existingCatways = await Catway.find().select('catwayNumber -_id').lean();
    const existingCatwaySet = new Set(existingCatways.map((c) => c.catwayNumber));

    const normalizedRows = rows
        .map((row) => ({
            catwayNumber: Number(row.catwayNumber),
            clientName: String(row.clientName || '').trim(),
            boatName: String(row.boatName || '').trim(),
            startDate: new Date(row.startDate),
            endDate: new Date(row.endDate)
        }))
        .filter((row) => Number.isInteger(row.catwayNumber) && row.catwayNumber > 0)
        .filter((row) => row.clientName && row.boatName)
        .filter((row) => !Number.isNaN(row.startDate.getTime()) && !Number.isNaN(row.endDate.getTime()))
        .filter((row) => row.endDate > row.startDate);

    const validRows = normalizedRows.filter((row) => existingCatwaySet.has(row.catwayNumber));
    const skippedMissingCatway = normalizedRows.length - validRows.length;

    const operations = validRows.map((row) => ({
        updateOne: {
            filter: {
                catwayNumber: row.catwayNumber,
                clientName: row.clientName,
                boatName: row.boatName,
                startDate: row.startDate,
                endDate: row.endDate
            },
            update: {
                $set: {
                    catwayNumber: row.catwayNumber,
                    clientName: row.clientName,
                    boatName: row.boatName,
                    startDate: row.startDate,
                    endDate: row.endDate
                }
            },
            upsert: true
        }
    }));

    if (!operations.length) {
        return { total: 0, inserted: 0, updated: 0, skippedMissingCatway };
    }

    const result = await Reservation.bulkWrite(operations, { ordered: false });
    return {
        total: operations.length,
        inserted: result.upsertedCount || 0,
        updated: result.modifiedCount || 0,
        skippedMissingCatway
    };
}

async function main() {
    const mode = parseMode(process.argv);

    await mongo.initClientDbConnection();

    if (mode === 'catways' || mode === 'all') {
        const catwayStats = await seedCatways();
        console.log('[seed][catways]', JSON.stringify(catwayStats));
    }

    if (mode === 'reservations' || mode === 'all') {
        const reservationStats = await seedReservations();
        console.log('[seed][reservations]', JSON.stringify(reservationStats));
    }

    await mongoose.connection.close();
}

main().catch(async (error) => {
    console.error('[seed] Erreur:', error.message);
    try {
        await mongoose.connection.close();
    } catch (_) {
        // ignore close error
    }
    process.exit(1);
});
