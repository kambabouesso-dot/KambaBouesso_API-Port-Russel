var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');

var indexRouter = require('./routes/index');
var authRouter = require('./routes/auth');
var catwaysRouter = require('./routes/catways');
var reservationsRouter = require('./routes/reservations');
var securityHeaders = require('./middlewares/securityHeaders');
var mongo = require('./db/mongo');
var runtimePort = process.env.PORT || '3000';
var isProduction = process.env.NODE_ENV === 'production';

function isWeakJwtSecret(secret) {
    if (!secret || typeof secret !== 'string') {
        return true;
    }

    return secret.startsWith('change-me-') || secret.length < 24;
}

function getAllowedOrigins() {
    const configured = process.env.CORS_ALLOWED_ORIGINS || process.env.API_URL || '';
    return configured
        .split(',')
        .map((origin) => origin.trim())
        .filter(Boolean);
}

if (!process.env.URL_MONGO) {
    console.warn('[Config] URL_MONGO absente: la connexion MongoDB va echouer.');
}

if (!process.env.JWT_SECRET) {
    console.warn('[Config] JWT_SECRET absente: le login/token ne fonctionnera pas.');
} else if (isWeakJwtSecret(process.env.JWT_SECRET)) {
    console.warn('[Config] JWT_SECRET semble faible: remplacez la valeur par un secret robuste.');
}

if (isProduction) {
    if (!process.env.URL_MONGO) {
        throw new Error('Configuration invalide: URL_MONGO est requise en production.');
    }

    if (isWeakJwtSecret(process.env.JWT_SECRET)) {
        throw new Error('Configuration invalide: JWT_SECRET est absent ou trop faible en production.');
    }
}

console.log('[Config] Demarrage avec PORT=' + runtimePort + ' API_URL=' + (process.env.API_URL || '(absente)'));

// Connexion MongoDB en arrière-plan (ne bloque pas le démarrage)
mongo.initClientDbConnection().catch(err => {
    console.error('Avertissement: Connexion MongoDB echouee', mongo.getSafeMongoErrorMessage(err));
});
var usersRouter = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');
app.disable('x-powered-by');

const allowedOrigins = getAllowedOrigins();

app.use(logger('dev'));
app.use(securityHeaders);
app.use(cors({
    origin: function(origin, callback) {
        // On autorise les clients non navigateur (sans header Origin) et l'allowlist configuree.
        if (!origin || allowedOrigins.includes(origin)) {
            return callback(null, true);
        }
        return callback(new Error('CORS origin non autorisee'));
    }
}));
app.use(express.json({ limit: '20kb' }));
app.use(express.urlencoded({ extended: false, limit: '20kb' }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', indexRouter);
app.use('/auth', authRouter);
app.use('/users', usersRouter);
app.use('/catways', catwaysRouter);
app.use('/reservations', reservationsRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    res.status(404).json({
        name:'mon application', 
        version:'1.0', 
        status: 404, 
        message: 'Ressource non trouvée' 
    });
});

// error handler
app.use(function(err, req, res, next) {
    const status = err.status || 500;

    // Les routes API renvoient un JSON minimal pour eviter les fuites d'informations.
    if (req.originalUrl.startsWith('/')) {
        return res.status(status).json({
            status: status,
            error: status >= 500 ? 'internal_error' : 'request_error',
            message: status >= 500 ? 'Erreur interne serveur' : (err.message || 'Requete invalide')
        });
    }

    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    res.status(status);
    return res.render('error');
});

module.exports = app;
