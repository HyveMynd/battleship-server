/**
 * Created by Andres Monroy (HyveMynd) on 11/4/14.
 */
// server.js (Express 4.0)
var path            = require('path');
var express         = require('express');
var morgan          = require('morgan');
var bodyParser      = require('body-parser');
var methodOverride  = require('method-override');
var session         = require('express-session');
var app             = express();

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
require('./routes/home')(app, express);

app.listen(3000);
console.log('Magic happens on port 3000');