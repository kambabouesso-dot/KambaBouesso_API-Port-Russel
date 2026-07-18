const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Reservation = new Schema({
    catwayNumber: {
        type: Number,
        required: [true, 'Le numero de catway est requis'],
        min: [1, 'Le numero de catway doit etre positif']
    },
    clientName: {
        type: String,
        trim: true,
        required: [true, 'Le nom du client est requis']
    },
    boatName: {
        type: String,
        trim: true,
        required: [true, 'Le nom du bateau est requis']
    },
    startDate: {
        type: Date,
        required: [true, 'La date de debut est requise']
    },
    endDate: {
        type: Date,
        required: [true, 'La date de fin est requise']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Reservation', Reservation);
