var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');


var app = express();

require('dotenv').config();

var engine = require('ejs-mate');
// view engine setup
app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'ejs');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(function (req, res, next) {
  res.locals.home_url = process.env.HOME_URL;
  res.locals.business_url = process.env.BUSINESS_URL;
  res.locals.admin_url = process.env.ADMIN_URL;
  global.api_url = process.env.API_URL;

  // get user selected languge and assing var
  const splString = (req.url).split("/");
  if(typeof req.body.lang != 'undefined' && req.body.lang != ''){
    checkLng = req.body.lang;
  }else{
    checkLng = splString[1] || "es";
  }
  if(checkLng == 'es'){
    res.locals.LANG = require(`./locale/es/message`).ADMIN_MSG;
    global.ADMIN_MSG = require(`./locale/es/message`).Messages;
  }else{
    res.locals.LANG = require(`./locale/en/message`).ADMIN_MSG;
    global.ADMIN_MSG = require(`./locale/en/message`).Messages;
  }
  next();
});

var index = require('./routes/index');

app.use('/', index);

// // catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   var err = new Error('Not Found');
//   err.status = 404;
//   next(err);
// });

// // error handler
// app.use(function (err, req, res, next) {
//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

module.exports = app;
