var express = require('express');
app = express();
var router = express.Router();
global.Models = require('../../models');
var Category = Models.Categories;
var Subcategories = Models.Subcategories;
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


router.get('/', FUNC.Auth, function (req, res, next) {
    var user_id = req.session.user.id;
    Subcategories.findAll({
        where: { 
            status: true ,
            id: { $notIn: JSON.parse("[20001]") },
        },
        order: [
            ['id', 'DESC']
        ],
        include: [
            { model: Category, attributes: ['id', 'name'] }
        ]
    }).then(results => {
        //console.log("catData===========>", JSON.stringify(results), null, 2);
        res.render('subcategory/index', { catData: results, title: 'subcategories' });
    }).catch(function (err) {
        console.log('catch', err);
        return res.redirect('/');
    });
});

router.get('/add', FUNC.Auth, function (req, res, next) {
    Category.findAll({
        where: { status: true, isActive: true },
        order: [
            ['name', 'ASC']
        ],
        raw: true
    }).then(cat => {
        res.render('subcategory/add', { title: 'subcategories', cat });
    }).catch(function (err) {
        console.log('catch', err);
        return res.redirect('/');
    });
});

router.post('/addCat', FUNC.Auth, function (req, res, next) {

    upload(req, res, function (err) {
        if (err) {
            if (err.code == 'LIMIT_FILE_SIZE') {
                req.flash('error', 'File size too large.Use maximum 15 MB file.');
            } else {
                req.flash('error', err);

            }
            return res.redirect('/subcategories/add/');
        }

        Subcategories.count({
            where: { categoryId: req.body.parent_cat, status: true }
        }).then(catCount => {
            /*if (catCount >= 3) {
                req.flash('error', 'You can add maximum 3 subcategories in each category.');
                return res.redirect('/subcategories');
            } else {*/
                var cat = {
                    name: req.body.name.trim(),
                    categoryId: req.body.parent_cat,
                    isActive: req.body.isActive,
                    icon: req.file.filename,
                    status: true
                };
                Subcategories.create(cat).then(result => {
                    console.log(result.get({ plain: true }));
                    req.flash('success', 'Subcategory added Successfully.');
                    return res.redirect('/subcategories');
                }).catch(function (err) {
                    console.log('err========>', err);
                    return res.redirect('/subcategories');
                });
            //}
        });
    });
});

router.get('/view/:id', FUNC.Auth, function (req, res, next) {
    Subcategories.findOne({
        where: { id: req.params.id },
    }).then(results => {
        Category.findAll({
            where: { status: true, isActive: true },
            order: [
                ['name', 'ASC']
            ],
            raw: true
        }).then(subcat => {
            res.render('subcategory/view', { cat: results, subcat: subcat, title: 'subcategories' });
        }).catch(function (err) {
            console.log('catch', err);
            return res.redirect('/');
        });
    }).catch(function (err) {
        req.flash('error', 'Something went wrong.');
        return res.redirect('/subcategories');
    });;
});

router.post('/updateCat/:id', FUNC.Auth, function (req, res, next) {

    upload(req, res, function (err) {
        if (err) {
            if (err.code == 'LIMIT_FILE_SIZE') {
                req.flash('error', 'File size too large.Use maximum 15 MB file.');
            } else {
                req.flash('error', err);
            }
            return res.redirect('/subcategories/view/' + req.params.id);
        }

        var update = { isActive: req.body.isActive };
        update.name = req.body.name.trim();
        update.categoryId = req.body.parent_cat;
        if (typeof (req.file) == 'undefined') {
        } else {
            update.icon = req.file.filename;
        }

        Subcategories.update(update, {
            where: { id: req.params.id }
        }).then(result => {
            req.flash('success', 'Subcategory updated successfully');
            res.redirect('/subcategories');
        }).catch(function (err) {
            console.log('error========>', err);
            req.flash('error', 'Something went wrong.');
            return res.redirect('/subcategories');
        });
    })

});

router.get('/delete/:id', FUNC.Auth, function (req, res, next) {
    Subcategories.update({ status: false }, {
        where: { id: req.params.id }
    }).then(result => {
        req.flash('success', 'Subcategory removed successfully');
        res.redirect('/subcategories');
    }).catch(function (err) {
        req.flash('error', 'Something went wrong.');
        return res.redirect('/');
    });
});

router.post('/status', FUNC.Auth, function (req, res, next) {
    var {
        id,
        status
    } = req.body;

    Subcategories.update({ isActive: status }, {
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

