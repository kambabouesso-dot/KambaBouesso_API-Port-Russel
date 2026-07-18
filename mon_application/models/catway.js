const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const Catway = new Schema({
    catwayNumber: {
        type: Number,
        required: [true, 'Le numero de catway est requis'],
        unique: true,
        min: [1, 'Le numero de catway doit etre positif']
    },
    catwayType: {
        type: String,
        required: [true, 'Le type de catway est requis'],
        enum: {
            values: ['short', 'long'],
            message: 'Le type de catway doit etre short ou long'
        }
    },
    catwayState: {
        type: String,
        trim: true,
        required: [true, 'L etat du catway est requis']
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('Catway', Catway);
