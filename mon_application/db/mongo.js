const mongoose = require('mongoose');

const clientOptions = {
  dbName : 'catways'
};

function maskMongoUri(uri) {
    if (!uri || typeof uri !== 'string') {
        return '(absente)';
    }

    return uri.replace(/\/\/([^:/@]+):([^@]+)@/, '//$1:***@');
}

function getMongoTarget(uri) {
    if (!uri || typeof uri !== 'string') {
        return '(inconnue)';
    }

    try {
        const parsed = new URL(uri);
        const dbFromPath = parsed.pathname && parsed.pathname !== '/' ? parsed.pathname.slice(1) : '';
        const dbName = dbFromPath || clientOptions.dbName;
        return parsed.protocol + '//' + parsed.host + '/' + dbName;
    } catch (error) {
        return maskMongoUri(uri);
    }
}

function getSafeMongoErrorMessage(error) {
    if (!error) {
        return 'Erreur MongoDB inconnue';
    }

    const code = error.code || (error.cause && error.cause.code);
    const message = error.message || (error.cause && error.cause.message) || 'Erreur MongoDB inconnue';

    return code ? message + ' (code: ' + code + ')' : message;
}

exports.initClientDbConnection = async () => {
    const mongoUri = process.env.URL_MONGO;
    const mongoTarget = getMongoTarget(mongoUri);

    try {
        if (!mongoUri) {
            throw new Error('URL_MONGO absente. Verifie votre fichier env charge.');
        }

        console.log('[MongoDB] Tentative de connexion vers', mongoTarget);
        await mongoose.connect(mongoUri, clientOptions);
        console.log('[MongoDB] Connexion reussie vers', mongoTarget);
    } catch (error) {
        console.error('[MongoDB] Echec de connexion vers', mongoTarget + '.', getSafeMongoErrorMessage(error));
        throw error;
    }
};

exports.getSafeMongoErrorMessage = getSafeMongoErrorMessage;