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
global.HttpStatus = require('http-status-codes');
var MySQLStore = require('express-mysql-session')(session);


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


var index = require('./apis/routes/index');

// // Common Functions file
global.FUNC = require('./functions/businessfunctions.js');

//Include all models
global.Models = require('./models');

//Include images urls
global.DealImageUrl = 'https://'+process.env.USER_IMG_BUCKET+'.s3.'+process.env.S3_REGION+'.amazonaws.com/deals/'
global.CouponImageUrl = 'https://'+process.env.USER_IMG_BUCKET+'.s3.'+process.env.S3_REGION+'.amazonaws.com/coupons/'

console.log("coupon url ====================",CouponImageUrl)

// Validation Rules
global.Validator = require('validatorjs');
global.vrules = require('./validation_rules.js').rules;


var engine = require('ejs-mate');
// view engine setup
app.engine('ejs', engine);
app.set('views', path.join(__dirname, 'business', 'views'));
app.set('view engine', 'ejs');


// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, '/public')));

app.use(function (req, res, next) {
  //if (!req.headers['language']) return res.status(203).json({type: false,data: {},message: "Incorrect Language"});
  if( req.headers['language']==undefined ){
    req.headers['language'] = 'en'
  }
  req.user_language = (req.headers['language']=='' || req.headers['language']==undefined || req.headers['language']=='en' ) ? 'en':req.headers['language'];
  if(req.headers['language']=='' || req.headers['language']==undefined || req.headers['language']=='en' ){
    //Validator.useLang('en');
    global.LANGTYPE = 'en';
    global.DM = require('./locale/en/message').API_MESSAGE;
  }else{
    global.LANGTYPE = 'es';
    global.DM = require('./locale/es/message').API_MESSAGE;
  }
	next();
});

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
  res.locals.business_user = req.session.business_user;
  res.locals.home_url = process.env.HOME_URL;
  res.locals.business_url = process.env.BUSINESS_URL;
  res.locals.admin_url = process.env.ADMIN_URL;

  console.log("----Request parameters----");
  console.dir({
    lang: req.headers['language'],
    path : req.originalUrl,
    method: req.method,
    body: req.body,
    params :  req.params,
    query : req.query
  });
  next();
});

app.use('/', index);

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
//   res.render('error');Estoques limitados acessível
module.exports = app;
