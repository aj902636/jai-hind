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
global.deatStaticText = "Limited products";

//console.log(global)
var app = express();

require('dotenv').config();

// Security Encryption
global.bcrypt = require('bcryptjs');

//console.log(process.env);
//var dbConfig = Config.get('Database');
//global.MSG = require('../../locale/en/messages.js');
global.sequelize = new Sequelize('mysql://'+process.env.DB_USER+':'+process.env.DB_PASS+'@'+process.env.HOST+'/'+process.env.DB_NAME, {
  timezone: '+05:30',
  //timezone: '+01:00',
  pool: {
    max: 50,
    min: 0,
    idle: 10000
  }
});



/*global.sequelize = new Sequelize('quopon', 'root', '', {
  host: 'localhost',
  dialect: 'mysql',

  pool: {
    max: 5,
    min: 0,
    idle: 10000
  }
});*/


var index = require('./admin/routes/index');

// // Common Functions file
global.FUNC = require('./functions/functions.js');

//Include all models
global.Models = require('./models');

// Validation Rules
global.Validator = require('validatorjs');
global.vrules = require('./validation_rules.js').rules;


var engine = require('ejs-mate');
// view engine setup
app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'admin', 'views'));
app.set('view engine', 'ejs');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
//app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ limit: '50mb', extended: false }));
app.use(bodyParser.json({ limit: '50mb' }));
//app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
//console.log(process.env);
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
  res.locals.error_flash = req.flash('error')[0];
  res.locals.success_flash = req.flash('success')[0];
  res.locals.user = req.session.user;
  res.locals.home_url = process.env.HOME_URL;
  res.locals.business_url = process.env.BUSINESS_URL;
  res.locals.admin_url = process.env.ADMIN_URL;
  next();
});

app.use('/', require(path.join(__dirname, 'admin', 'routes', 'index.js')));
app.use('/pages', require(path.join(__dirname, 'admin', 'routes', 'pages.js')));
app.use('/categories', require(path.join(__dirname, 'admin', 'routes', 'categories.js')));
app.use('/subcategories', require(path.join(__dirname, 'admin', 'routes', 'subcategories.js')));
app.use('/pages', require(path.join(__dirname, 'admin', 'routes', 'pages.js')));
app.use('/couponRating', require(path.join(__dirname, 'admin', 'routes', 'couponRating.js')));
app.use('/coupons', require(path.join(__dirname, 'admin', 'routes', 'coupons.js')));
app.use('/coupon_detail', require(path.join(__dirname, 'admin', 'routes', 'coupon_details.js')));
app.use('/deals', require(path.join(__dirname, 'admin', 'routes', 'deals.js')));
app.use('/prices', require(path.join(__dirname, 'admin', 'routes', 'prices.js')));
app.use('/users', require(path.join(__dirname, 'admin', 'routes', 'users.js')));
app.use('/business', require(path.join(__dirname, 'admin', 'routes', 'business.js')));
app.use('/reports', require(path.join(__dirname, 'admin', 'routes', 'reports.js')));
app.use('/admin_coupons', require(path.join(__dirname, 'admin', 'routes', 'admin_coupons.js')));
app.use('/subscribers', require(path.join(__dirname, 'admin', 'routes', 'subscribers.js')));
app.use('/city', require(path.join(__dirname, 'admin', 'routes', 'city.js')));
app.use('/paymentMessage', require(path.join(__dirname, 'admin', 'routes', 'paymentMessage.js')));


// catch 404 and forward to error handler
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
