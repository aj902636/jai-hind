var express = require('express');
app = express();
var router = express.Router();
global.Models = require('../../models');
var Reports = Models.Reports;
global.FUNC = require('../../functions/businessfunctions.js');

router.get('/', FUNC.Auth, function (req, res, next) {
    res.render('reports/add', { title: 'reports' });
});

/*  Send mail and stores complain to admin  */
router.post('/sendReport', FUNC.Auth, function (req, res, next) {

    var report = {
        subject: req.body.subject,
        message: req.body.message,
        user_type:2,
        user_id :req.session.business_user.id
    };
    Reports.create(report).then(result => {

    var template = new EmailTemplate(path.join(__dirname, '../../templates/', 'business_complain'));
    nodemailer.createTestAccount((err, account) => {
        let transporter = nodemailer.createTransport(
            {
                host: process.env.SMTP_HOST,
                port: process.env.SMTP_PORT,
                secure: false,
                auth: {
                    user: process.env.SMTP_USER, // generated ethereal user
                    pass: process.env.SMTP_PASS  // generated ethereal password
                },
                tls: {rejectUnauthorized: false},
                   debug:true
            });
        var uname = req.session.business_user.fname + ' ' + req.session.business_user.lname;
        var locals = {
            custom: { user_name: uname,business_url:process.env.BUSINESS_URL,current_year:moment().format('YYYY'), email: req.session.business_user.email, subject: req.body.subject, message: req.body.message }
        }
        template.render(locals, function (err, results) {
            if (err) {
                if (err) return next(err);
            } else {

                let mailOptions = {
                    from: process.env.FROM_MAIL,
                    to: process.env.ADMIN_EMAIL,
                    subject: 'Complain by Business user',
                    text: results.text,
                    html: results.html // html bodynewpass
                };
                // send mail with defined transport objenewpassct
                transporter.sendMail(mailOptions, (error, info) => {
                    if (error) {
                        return console.log(error);
                    }
                    console.log('Message sent: %s', info.messageId);
                    req.flash('success', ADMIN_MSG.ComplainSend);
                    return res.redirect('/reports');
                });
            }
        });
    });

    }).catch(function (err) {
        console.log('catch========>', err);
        return res.redirect('/reports');
    });

});

module.exports = router;

