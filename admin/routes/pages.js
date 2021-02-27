var express = require('express');
app = express();
var router = express.Router();
global.Models = require('../../models');
var Pages = Models.Pages;
global.FUNC = require('../../functions/functions.js');


router.get('/', FUNC.Auth, function (req, res, next) {
    var user_id = req.session.user.id;
    Pages.findAll({
        where: { user_id: user_id, status: true },
        raw: true
    }).then(results => {
        const data = {};
        results.forEach(element => {
            data[element.slug] = element;
        });
        res.render('pages', { title: 'pages', data });
    }).catch(function (err) {
        console.log('catch', err);
        res.render('pages', { title: 'pages' });
    });
});


router.post('/updatePage/:id?', FUNC.Auth, function (req, res, next) {

    var data = {
        user_id: req.session.user.id,
        user_type: 1
    }
    if ('about_us' in req.body) {
        data.slug = 'about_us',
            data.description = req.body.about_us;
            data.description_pt = req.body.description_pt;
    }
    if ('contact_us' in req.body) {
        data.slug = 'contact_us',
            data.description = req.body.contact_us;
            data.description_pt = req.body.description_pt;
    }
    if ('terms' in req.body) {
        data.slug = 'terms',
            data.description = req.body.terms;
            data.description_pt = req.body.description_pt;
    }
    if ('faq' in req.body) {
        data.slug = 'faq',
            data.description = req.body.faq;
            data.description_pt = req.body.description_pt;
    }
    if ('privacy' in req.body) {
        data.slug = 'privacy',
            data.description = req.body.privacy;
            data.description_pt = req.body.description_pt;
    }
        

    if (typeof req.params.id == 'undefined') {
        Pages.create(data).then(result => {
            //console.log(result.get({ plain: true }));
            req.flash('success', 'Page Updated Successfully.');
            return res.redirect('/pages');
        }).catch(function (err) {
            console.log('catch', err);
            return res.redirect('/pages');
        });
    } else {
        var page_id = req.params.id;
        Pages.update(data, {
            where: { id: page_id, user_type: 1 }
        }).then(result => {
            req.flash('success', 'Page Updated Successfully.');
            return res.redirect('/pages');
        }).catch(function (err) {
            req.flash('error', 'Something went wrong.');
            return res.redirect('/');
        });
    };
});

module.exports = router;

