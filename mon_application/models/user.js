const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const bcrypt = require('bcrypt');

const User = new Schema({
    name: {
        type: String,
        trim: true,
        required: [true, 'Le nom est requis']
    },
    email: {
        type: String,
        trim: true,
        required: [true, "L'email est requis"],
        unique: true,
        lowercase: true,
    },
    password: {
        type: String,
        trim: true,
        required: [true, 'Le mot de passe est requis']
    },
    role: {
        type: String,
        enum: ['user', 'admin'],
        default: 'user'
    }
}, { 
    timestamps: true 
});

User.pre('save', function() {
    // Le hash n'est recalcule que si le mot de passe a ete modifie.
    if (!this.isModified('password')) {
        return;
    }

    this.password = bcrypt.hashSync(this.password, 10);
});

module.exports = mongoose.model('User', User);
