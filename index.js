/**
 * Created by Andres Monroy (HyveMynd) on 11/4/14.
 */
// server.js (Express 4.0)
var path            = require('path');
var express         = require('express');
var morgan          = require('morgan');
var bodyParser      = require('body-parser');
var methodOverride  = require('method-override');
var app             = express();
var util            = require('util');

// view engine setup
app.set('views', path.join(__dirname, './views'));
app.set('view engine', 'jade');

app.use(express.static(__dirname + '/public'));
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(methodOverride());

app.use(require('stylus').middleware(path.join(__dirname, './public')));
app.use(express.static(path.join(__dirname, './public')));

require('./routes/games')(app, express);
app.use('/api/v2/games', require('./routes/gamesv2')(express));
app.use('/api/v2/lobby', require('./routes/lobby')(express));
require('./routes/home')(app, express);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
    var err = new Error('Not Found');
    err.status = 404;
    next(err);
});

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        console.log(err.stack);
        res.status(err.status || 500);
        res.render('error', {
            message: err.message,
            error: err
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.render('error', {
        message: err.message,
        error: {}
    });
});

app.set('port', process.env.port || 3000);
app.listen(app.get('port'));
console.log(util.format('Magic happens on port %s in %s', app.get('port'), app.get('env')));