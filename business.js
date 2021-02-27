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
const cron = require('node-cron');

//global.deatStaticText = "Articulos limitados disponibles";

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

var index = require('./business/routes/index');

// // Common Functions file
global.FUNC = require('./functions/businessfunctions.js');
global._ = require('lodash')

//Include all models
global.Models = require('./models');

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
app.use(bodyParser.json({limit: '50mb', extended: true}));
app.use(bodyParser.urlencoded({limit: '50mb', extended: false }));
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
  //console.log( "req.session.business_user",req.session.business_user )

  res.locals.error_flash = req.flash('error')[0];
  res.locals.success_flash = req.flash('success')[0];
  res.locals.business_user = req.session.business_user;
  res.locals.home_url = process.env.HOME_URL;
  res.locals.business_url = process.env.BUSINESS_URL;
  res.locals.admin_url = process.env.ADMIN_URL;
  res.locals.momentJs = require("moment");
  global.ADMIN_MSG = require("./locale/es/message").Messages;
  res.locals.LANG = require("./locale/es/message").ADMIN_MSG;

  if( req.session.business_user ){
    var current_date =  new Date() //moment().format("DD.MM.YYYY");
    var created_date =  new Date(req.session.business_user.createdAt) // moment(req.session.business_user.createdAt).format("DD.MM.YYYY");
    var end_date = new Date(new Date(created_date).getTime()+(120*24*60*60*1000));
    const diffTime = Math.abs(end_date.getTime() -current_date.getTime() );
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if(typeof req.session.business_user.user_lang != 'undefined' && req.session.business_user.user_lang != '' && req.session.business_user.user_lang == 'en'){
      res.locals.LANG = require("./locale/en/message").ADMIN_MSG;
      global.LANG = require("./locale/en/message").ADMIN_MSG;
      global.ADMIN_MSG = require("./locale/en/message").Messages;
      let warMsg = LANG.BusinessWarning;
      res.locals.header_msg = warMsg.replace("[DAYS]",diffDays);
    }else{
      res.locals.LANG = require("./locale/es/message").ADMIN_MSG;
      global.LANG = require("./locale/es/message").ADMIN_MSG;
      global.ADMIN_MSG = require("./locale/es/message").Messages;
      let warMsg = LANG.BusinessWarning;
      res.locals.header_msg = warMsg.replace("[DAYS]",diffDays);
    }

    if(req.session.business_user.user_lang == 'es'){
      global.deatStaticText = "Productos limitados";
    }else{
      global.deatStaticText = "Limited products";
    }
  }


  res.locals.business_user2 = req.session.business_user;
  // get user selected languge and assing var
  const splString = (req.url).split("/");
  let checkLng = '';
  if(splString[1]=='login' || splString[1]=='forgot_password' || splString[1]=='signup'){
    if(typeof req.body.lang != 'undefined' && req.body.lang != ''){
      checkLng = req.body.lang;
    }else{
      checkLng = splString[2] || "es";
    }
    if(checkLng == 'es'){
      res.locals.LANG = require(`./locale/es/message`).ADMIN_MSG;
      global.ADMIN_MSG = require(`./locale/es/message`).Messages;
    }else{
      res.locals.LANG = require(`./locale/en/message`).ADMIN_MSG;
      global.ADMIN_MSG = require(`./locale/en/message`).Messages;
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
app.use('/pages', FUNC.hasStore, require(path.join(__dirname, 'business', 'routes', 'pages.js')));
app.use('/stores', require(path.join(__dirname, 'business', 'routes', 'stores.js')));
app.use('/deals', FUNC.hasStore, require(path.join(__dirname, 'business', 'routes', 'deals.js')));
app.use('/coupons', FUNC.hasStore, require(path.join(__dirname, 'business', 'routes', 'coupons.js')));
app.use('/ads', FUNC.hasStore, require(path.join(__dirname, 'business', 'routes', 'ads.js')));
app.use('/reports', FUNC.hasStore, require(path.join(__dirname, 'business', 'routes', 'reports.js')));
app.use('/users', require(path.join(__dirname, 'business', 'routes', 'users.js')));
app.use('/finance', FUNC.hasStore, require(path.join(__dirname, 'business', 'routes', 'finance.js')));
app.use('/payment', FUNC.hasStore, require(path.join(__dirname, 'business', 'routes', 'payment.js')));



// catch 404 and forward to error handler
// app.use(function (req, res, next) {
//   console.log("hereeeee");
//   var err = new Error('Not Found');
//   err.status = 404;
//   next(err);
// });

// error handlerbody
// app.use(function (err, req, res, next) {


//   // set locals, only providing error in development
//   res.locals.message = err.message;
//   res.locals.error = req.app.get('env') === 'development' ? err : {};

//   // render the error page
//   res.status(err.status || 500);
//   res.render('error');
// });

// cron wont start automatically
var task = cron.schedule('59 * * * * *', () => {
  FUNC.sendNotification();
  FUNC.sendNotiOnExpireCoupon();
  //FUNC.getPaymentSet();
  //FUNC.expireWelcomCoupon();
}, {
	scheduled: false,
  // timezone: "Europe/London"
});

/*
cron.schedule('0 0 * * *', async () => {
  FUNC.expireDeals();
  var users =   await Models.User.findAll({
    where: { user_type: 2, isActive :true, adminApproved:true },
    attributes: ['id', "createdAt"]
  })
  if( users && users.length>0 ){
    _.each( users,async (user,index)=>{
      let current_date =  new Date()
      let created_date =  new Date(user.dataValues.createdAt)
      let end_date = new Date(new Date(created_date).getTime()+(120*24*60*60*1000));
      let diffTime = Math.abs(end_date.getTime() -current_date.getTime() );
      let diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));


      if( diffDays>120 ){
        let qry  = await Models.User.update({ 'isActive': false }, {
          where: { id:user.dataValues.id }
        })
        console.log( "qry", qry)
      }
    })
  }
});
*/

// start method is called to start the above defined cron job
task.start();

module.exports = app;
