var express = require('express');
app = express();
var router = express.Router();
global.Models = require('../../models');
var Category = Models.Categories;
global.FUNC = require('../../functions/functions.js');


var path = require('path');
var multer = require('multer');
var storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'public/uploads/cats/')
    },
    filename: function (req, file, cb) {
        var extname = path.extname(file.originalname).toLowerCase();
        cb(null, req.body.name.trim() + '-' + Date.now()+extname)
    }
});

var upload = multer({
    storage: storage,
    fileFilter: function (req, file, cb) {
        var filetypes = /jpeg|jpg|gif|png/;
        var mimetype = filetypes.test(file.mimetype);
        var extname = filetypes.test(path.extname(file.originalname).toLowerCase());
        if (mimetype && extname) {
            return cb(null, true);
        }
        cb("Only images are allowed with following filetypes - " + filetypes);
    },
    limits: { fileSize: 15 * 1024 * 1024 }
}).single('foo');

/*-------> List All Categories <----------*/
router.get('/', FUNC.Auth, function (req, res, next) {
    var user_id = req.session.user.id;
    Category.findAll({
        where: {
            status: true,
            id: { $notIn: JSON.parse("[10001]") },
        },
        order: [
            ['id', 'DESC']
        ],
        raw: true
    }).then(results => {
        console.log(results);
        res.render('category/index', { catData: results, title: 'categories' });
    }).catch(function (err) {
        console.log('catch', err);
        return res.redirect('/');
    });
});

/*-------> Add Category Page View  <----------*/
router.get('/add', FUNC.Auth, function (req, res, next) {
    res.render('category/add', { title: 'categories' });
})

/*-------> Add Category in Database  <----------*/
router.post('/addCat', FUNC.Auth, function (req, res, next) {

    upload(req, res, function (err) {
        if (err) {
            console.log(err)
            if (err.code == 'LIMIT_FILE_SIZE') {
                req.flash('error', 'File size too large.Use maximum 15MB file.');
            } else {
                req.flash('error', err);

            }
            return res.redirect('/categories/add/');
        }
       //console.log(req.file);
        Category.count({
            where: { status: true }
        }).then(catCount => {
           /* if (catCount >= 5) {
                req.flash('error', 'You can add maximum 5 categories.');
                return res.redirect('/categories');
            } else {*/
                var cat = {
                    name: req.body.name.trim(),
                    icon: req.file.filename,
                    isActive: req.body.isActive,
                    status: true
                };
                Category.create(cat).then(result => {
                    console.log(result.get({ plain: true }));
                    req.flash('success', 'Category added Successfully.');
                    return res.redirect('/categories');
                }).catch(function (err) {
                    console.log('catch========>', err);
                    return res.redirect('/categories');
                });
           // }
        });
    });
});

/*-------> View Category By ID  <----------*/
router.get('/view/:id', FUNC.Auth, function (req, res, next) {
    Category.findOne({
        where: { id: req.params.id },

    }).then(results => {
        res.render('category/view', { cat: results, title: 'categories' });
    }).catch(function (err) {
        req.flash('error', 'Something went wrong.');
        return res.redirect('/categories');
    });;
});

/*-------> Update Category  <----------*/
router.post('/updateCat/:id', FUNC.Auth, function (req, res, next) {

    upload(req, res, function (err) {
        if (err) {
            if (err.code == 'LIMIT_FILE_SIZE') {
                req.flash('error', 'File size too large.Use maximum 15MB file.');
            } else {
                req.flash('error', err);

            }
            return res.redirect('/categories/view/' + req.params.id);
        }

        var update = { isActive: req.body.isActive };
        update.name = req.body.name.trim();
        if (typeof (req.file) == 'undefined') {
        } else {
            update.icon = req.file.filename;
        }

        Category.update(update, {
            where: { id: req.params.id }
        }).then(result => {
            req.flash('success', 'Category updated successfully');
            res.redirect('/categories');
        }).catch(function (err) {
            req.flash('error', 'Something went wrong.');
            return res.redirect('/categories');
        });
    });

});

/*-------> Delete Category  <----------*/
router.get('/delete/:id', FUNC.Auth, function (req, res, next) {
    Category.update({ status: false }, {
        where: { id: req.params.id }
    }).then(result => {
        req.flash('success', 'Category removed successfully');
        res.redirect('/categories');
    }).catch(function (err) {
        req.flash('error', 'Something went wrong.');
        return res.redirect('/');
    });
});

/*---------> Change Active Status <---------*/
router.post('/status', FUNC.Auth, function (req, res, next) {
    var {
        id,
        status
    } = req.body;

    Category.update({ isActive: status }, {
        where: { id: id }
    }).then(result => {
        if (result)
            res.status(200).json({
                message: `status changed ${status}`
            });
    }).catch(function (err) {
        if (err)
            res.status(200).json({
                message: err
            });
    });
});



module.exports = router;

