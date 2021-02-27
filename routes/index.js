var express = require('express');
var router = express.Router();
var nodemailer = require('nodemailer');
var request = require("request");

/* GET home page. */
router.get('/:lang?', function (req, res, next) {
  let lang = 'es';
	if(typeof req.params.lang != "undefined" && req.params.lang != '' && req.params.lang == 'en'){
		lang = 'en';
  }
  request.get(api_url+"front_deals", (error, response, body) => {
    console.log("--body--",body)
      if(error || body == undefined) {
          res.render('index', { title: 'Kupon', dealInfo: {}, lang });
      }else{
        console.log("--body--",body)
        const result = JSON.parse(body);
        res.render('index', { title: 'Kupon', dealInfo: result.dealInfo, lang });
      }
  });
});

router.get('/:slug/:lang?', function (req, res, next) {
  let lang = 'es';
	if(typeof req.params.lang != "undefined" && req.params.lang != '' && req.params.lang == 'en'){
		lang = 'en';
  }
  if(typeof req.params.slug == "undefined" || req.params.slug == ''){
		res.redirect('/');
  }
  const slug = req.params.slug;
  request.get(`http://182.76.237.236:3005/pages/${slug}`, (error, response, body) => {
      if(error) {
          res.redirect('/');
      }else{
        const result = JSON.parse(body);
        console.log("---result",result)
        if(lang == 'en'){
          var pageData = result.data.description;
        }else{
          var pageData = result.data.description_pt;
        }
        res.render('page', { title: 'Kupon', pageContent: pageData, lang, slug });
      }
  });
});

/* send enquiry. */
router.post('/send_inquiry', function (req, res, next) {
  console.log(req.body)
  var { email, fullname, message } = req.body;
  if (typeof email == 'undefined' || typeof message == 'undefined' || typeof fullname == 'undefined' || email == '' || fullname == ''|| message == '') {
    res.status(203).json({
      status: false,
      message: ADMIN_MSG.FillValidDetails
    })
  } else {
    // Prepare nodemailer transport object
    var transporter = nodemailer.createTransport({
        //from: process.env.SMTP_FROM,
        //host: process.env.SMTP_HOST, // hostname
        host: process.env.SMTP_HOST,
        port: process.env.SMTP_PORT,
        secure: false,
        //service: process.env.SMTP_SERVICE,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        tls: {rejectUnauthorized: false},
				debug:true
    });
    const mailOptions = {
      from: process.env.SMTP_FROM, // sender address
      to: "contacto@kupon.co.ao",//process.env.SMTP_RECEIVER, // list of receivers
      subject: process.env.SMTP_SUBJECT, // Subject line
      html: '<p>Hello Admin.</p> <p>You have received a new inquiry.</p> <p> </p><p> Details are as follow : </p> <p>Email  : '+email+' </p> <p>Full Name : '+fullname+' </p> <p>Message : '+message+' </p><p> </p> <p>Thank you !</p>'// plain text body
    };
    transporter.sendMail(mailOptions, function (err, info) {
      if (err) {
        console.log("err",err);
        res.status(200).json({
          status: false,
          message: ADMIN_MSG.InquirySent,
          data: {}
        })
      } else {
        res.status(200).json({
          status: true,
          message: ADMIN_MSG.InquirySent,
          data: {}
        })
      }
    });

    const mailOptionsUser = {
      from: process.env.FROM_MAIL, // sender address
      to: email, // list of receivers
      subject: "Your request sent to Kupon", // Subject line
      html: '<p>Hello '+fullname+', </p><p> </p> <p>You inquiry sent to kupon.</p> <p> we will back to you soon </p><p> </p> <p>Thank you !</p>'// plain text body
    };
    transporter.sendMail(mailOptionsUser, function (err, info) {
      if (err) {
        console.log("err",err);
        res.status(200).json({
          status: false,
          message: ADMIN_MSG.InquirySent,
          data: {}
        })
      } else {
        res.status(200).json({
          status: true,
          message: ADMIN_MSG.InquirySent,
          data: {}
        })
      }
    });
  }
});


module.exports = router;
