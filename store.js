"use strict";
var express = require('express');
var path = require('path');
//var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');
global.session = require('express-session');
global.flash = require('connect-flash');
const Sequelize = require('sequelize');
global.EmailTemplate = require('email-templates').EmailTemplate;
global.nodemailer = require('nodemailer');
global.path = require('path');
global.moment = require('moment');
var MySQLStore = require('express-mysql-session')(session);
//global.deatStaticText = "Estoques limitados acessível";


var app = express();

require('dotenv').config();

// Security Encryption
global.bcrypt = require('bcryptjs');


global.sequelize = new Sequelize('mysql://'+process.env.DB_USER+':'+process.env.DB_PASS+'@'+process.env.HOST+'/'+process.env.DB_NAME, {
  timezone: '+05:30',
  //timezone: '+01:00',
  pool: {
    max: 50,
    min: 0,
    idle: 10000
  }
});


var index = require('./store/routes/index');

// // Common Functions file
global.FUNC = require('./functions/storefunctions.js');

//Include all models
global.Models = require('./models');

// Validation Rules
global.Validator = require('validatorjs');
global.vrules = require('./validation_rules.js').rules;


var engine = require('ejs-mate');
// view engine setup
app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'store', 'views'));
app.set('view engine', 'ejs');


// uncomment after placing your favico FUNC.hasStoren in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

var options = {
  //host: '192.168.0.135',
  host: process.env.HOST,
  port: process.env.MYSQLPORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASS,
  database: process.env.DB_NAME
};

var sessionStore = new MySQLStore(options);

app.use(session({
  key: 'session_cookie_name',
  secret: 'session_cookie_secret',
  store: sessionStore,
  resave: false,
  saveUninitialized: false
}));

app.use(flash());
app.use(function (req, res, next) {
  res.locals.momentJs = require("moment");
  res.locals.error_flash = req.flash('error')[0];
  res.locals.success_flash = req.flash('success')[0];
  res.locals.store_user = req.session.store_user;
  res.locals.home_url = process.env.HOME_URL;
  res.locals.business_url = process.env.BUSINESS_URL;
  res.locals.admin_url = process.env.ADMIN_URL;
  res.locals.store_url = process.env.STORE_URL;
  global.ADMIN_MSG = require("./locale/en/message").Messages;

  if(req.session.store_user && typeof req.session.store_user.user_lang != 'undefined' && req.session.store_user.user_lang != 'null' && req.session.store_user.user_lang == 'en'){
    res.locals.LANG = require("./locale/en/message").ADMIN_MSG;
    global.LANG = require("./locale/en/message").ADMIN_MSG;
    global.ADMIN_MSG = require("./locale/en/message").Messages;
    global.deatStaticText = "Limited products";
  }else{
    res.locals.LANG = require("./locale/es/message").ADMIN_MSG;
    global.LANG = require("./locale/es/message").ADMIN_MSG;
    global.ADMIN_MSG = require("./locale/es/message").Messages;
    global.deatStaticText = "Productos limitados";
  }


  const splString = (req.url).split("/");
  let checkLng = '';
  if(splString[1]=='login' || splString[1]=='forgot_password'){
    if(typeof req.body.lang != 'undefined' && req.body.lang != ''){
      checkLng = req.body.lang;
    }else{
      checkLng = splString[2] || "es";
    }
    if(checkLng == 'en'){
      res.locals.LANG = require(`./locale/en/message`).ADMIN_MSG;
      global.ADMIN_MSG = require(`./locale/en/message`).Messages;
    }else{
      res.locals.LANG = require(`./locale/es/message`).ADMIN_MSG;
      global.ADMIN_MSG = require(`./locale/es/message`).Messages;
    }



  }

  console.dir({
    path : req.originalUrl,
    method: req.method,
    body: req.body,
    params :  req.params,
    param :  req.param,
    query : req.query
  });

  next();
});

app.use('/', index);
app.use('/deals', require(path.join(__dirname, 'store', 'routes', 'deals.js')));
app.use('/finance', require(path.join(__dirname, 'store', 'routes', 'finance.js')));
app.use('/coupons',require(path.join(__dirname, 'store', 'routes', 'coupons.js')));
app.use('/users', require(path.join(__dirname, 'store', 'routes', 'users.js')));

// catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   console.log("hereeeee");
//   var err = new Error('Not Found');
//   err.status = 404;
//   next(err);
// });

// error handler
// app.use(function (err, req, res, next) {


//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

module.exports = app;
