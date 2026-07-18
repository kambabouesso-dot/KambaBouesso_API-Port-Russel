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
var mongo = require('./db/mongo');
var runtimePort = process.env.PORT || '3000';

if (!process.env.URL_MONGO) {
    console.warn('[Config] URL_MONGO absente: la connexion MongoDB va echouer.');
}

if (!process.env.JWT_SECRET) {
    console.warn('[Config] JWT_SECRET absente: le login/token ne fonctionnera pas.');
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

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
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
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
