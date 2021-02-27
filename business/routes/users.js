var express = require('express');
var router = express.Router();
global.Models = require('../../models');
var Users = Models.User;
var Cities = Models.Cities;
var Business = Models.Business;
global.FUNC = require('../../functions/businessfunctions.js');


/*----> All Users listing <----*/
router.get('/', async (req, res, next)=> {
    //req.query.city = 6469;
    if(typeof req.query.city != 'undefined' && req.query.city != '' && req.query.city != 'All'  && req.query.city != 'all'){
        var cityData = "AND city = "+req.query.city;
        var getCityObj = await sequelize.query( "SELECT name FROM cities WHERE id = "+req.query.city+"" ,{ type: sequelize.QueryTypes.SELECT });
        var getCity = getCityObj[0].name;
    }else{
        var cityData = "";
        var getCity = "";
    }
    console.log("---req.session.business_user",req.session.business_user)
    let businessSubCat = req.session.business_user.business.categoryId;
    try{
        var ageQuery =
        `select id,dob,TIMESTAMPDIFF(YEAR, dob, CURDATE()) AS age
        from users
        where gender IN ('Male','Female') AND dob!='0000-00-00' and isActive = 1 AND status = 1 ${cityData} AND subcategory IN (select id from subcategories where categoryId in (${businessSubCat})) AND dob IS NOT NULL  having age >= 15
        `;

        var agedata = await sequelize.query( ageQuery ,{ type: sequelize.QueryTypes.SELECT });
        var ageObj = [];
        var showGraph = "";
        if( agedata && agedata.length>0 ){
            ageObj = [
                // {
                //     name: "0-10",
                //     y: 0
                // },
                {
                    name: "15-20",
                    y: 0
                },
                {
                    name: "21-30",
                    y: 0
                },
                {
                    name: "31-40",
                    y: 0
                },
                {
                    name: "41-50",
                    y: 0
                },
                {
                    name: "51-60",
                    y: 0
                },
                {
                    name: "61-70",
                    y: 0
                },
                {
                    name: "71-80",
                    y: 0
                },
                {
                    name: "81-90",
                    y: 0
                },
                {
                    name: "91-100",
                    y: 0
                }
            ]
            _.each( agedata,(a)=>{
                // if( a.age>=0 && a.age<11 ){
                //     ageObj[0].y =ageObj[0].y+1
                // }else
                if( a.age>=15 && a.age<21 ){
                    ageObj[0].y =ageObj[0].y+1
                }else if( a.age>=21 && a.age<31 ){
                    ageObj[1].y =ageObj[1].y+1
                }else if( a.age>=31 && a.age<41 ){
                    ageObj[2].y =ageObj[2].y+1
                }else if( a.age>=41 && a.age<51 ){
                    ageObj[3].y =ageObj[3].y+1
                }else if( a.age>=51 && a.age<61 ){
                    ageObj[4].y =ageObj[4].y+1
                }else if( a.age>=61 && a.age<71 ){
                    ageObj[5].y =ageObj[5].y+1
                }else if( a.age>=71 && a.age<81 ){
                    ageObj[6].y =ageObj[6].y+1
                }else if( a.age>=81 && a.age<91 ){
                    ageObj[7].y =ageObj[7].y+1
                }else if( a.age>=91 ){
                    ageObj[8].y =ageObj[8].y+1
                }
            })

            showGraph = 'Age Range';
        }

        sequelize.query("SELECT (SELECT count(id) FROM users WHERE  gender = 'Male' "+cityData+" AND `user_type` = 3 AND dob!='0000-00-00' AND dob IS NOT NULL AND isActive = 1 AND status = 1 AND subcategory in (select id from subcategories where categoryId in ("+businessSubCat+")) ) AS countMale, (SELECT count(id) FROM users WHERE gender = 'Female' "+cityData+" AND `user_type` = 3 AND dob!='0000-00-00' AND dob IS NOT NULL AND isActive = 1 AND status = 1 AND subcategory in (select id from subcategories where categoryId in ("+businessSubCat+"))) AS countFemale FROM `users` GROUP BY gender LIMIT 1", { type: sequelize.QueryTypes.SELECT })
        .then(results => {
            Cities.findAll({
                // where: { state_id: 2728 },
                attributes: ['id','name'],
                order: [['name', 'ASC']],
                raw: true
            }).then(cityList => {
                console.log("---------------------results",results)
                var cityName = (getCity)?getCity: LANG.All ;
                var countMale = (results.length)?results[0].countMale:0;
                var countFemale = (results.length)?results[0].countFemale:0;
                res.render('users/view', {
                    countMale,
                    countFemale,
                    title: 'users',
                    cityList, cityName,
                    ageObj,
                    showGraph,
                    'selectCity':req.query.city||0
                });
            });
        }).catch(function (err) {
            console.log('catch', err);
            return res.redirect('/dashboard');
        });
    }catch( err ){
        return next(err);
    }
});


// /*----> All Users listing <----*/
// router.get('/', function (req, res, next) {
//     var user_id = req.session.business_user.id;
//     Users.findAll({
//         where: { status: true, user_type: 3 },
//         raw: true
//     }).then(results => {
//         console.log(results);
//         res.render('users/index', { userInfo: results, title: 'users' });
//     }).catch(function (err) {
//         console.log('catch', err);
//         return res.redirect('/');
//     });
// });

/*-------> Edit Category By ID  <----------*/
router.get('/edit/:id', FUNC.Auth, function (req, res, next) {
    Users.findOne({
        where: { id: req.params.id, user_type: 3 }
    }).then(results => {
        sequelize.query("SELECT * FROM `states`", { type: sequelize.QueryTypes.SELECT })
            .then(states => {
                res.render('users/edit', { userInfo: results, states, title: 'users' });
            });
    }).catch(function (err) {
        req.flash('error', ADMIN_MSG.CommonError);
        return res.redirect('/users');
    });
});

/*-------> View Category By ID  <----------*/
router.get('/view/:id', FUNC.Auth, function (req, res, next) {
    Users.findOne({
        where: { id: req.params.id, user_type: 3 },
    }).then(results => {
        console.log(results);
        res.render('users/view', { userInfo: results, title: 'users' });
    }).catch(function (err) {
        req.flash('error', ADMIN_MSG.CommonError);
        return res.redirect('/users');
    });
});

/*-------> Update Category  <----------*/
router.post('/updateUser/:id', FUNC.Auth, function (req, res, next) {
    var update = req.body;
    delete update['email'];
    Users.update(update, {
        where: { id: req.params.id, user_type: 3 }
    }).then(result => {
        req.flash('success', 'User updated successfully');
        res.redirect('/users');
    }).catch(function (err) {
        req.flash('error', ADMIN_MSG.CommonError);
        return res.redirect('/users');
    });


});

/*-------> Delete User  <----------*/
router.get('/delete/:id', FUNC.Auth, function (req, res, next) {
    Users.update({ status: false }, {
        where: { id: req.params.id, user_type: 3 }
    }).then(result => {
        req.flash('success', 'User removed successfully');
        res.redirect('/users');
    }).catch(function (err) {
        req.flash('error', ADMIN_MSG.CommonError);
        return res.redirect('/');
    });
});

/*---------> Change Active Status <---------*/
router.post('/status', FUNC.Auth, function (req, res, next) {
    var {
        id,
        status
    } = req.body;

    Users.update({ isActive: status }, {
        where: { id: id, user_type: 3 }
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

router.post('/get_cities', function (req, res, next) {
    sequelize.query("SELECT * FROM `cities` WHERE `state_id`=:state_id", { replacements: { state_id: req.body.id } },
        { type: sequelize.QueryTypes.SELECT })
        .spread(cities => {
            var y = new Array('<option value="">-- Select City --</option>');
            if (cities && cities.length > 0) {
                cities.forEach(function (value, index) {
                    var selected = "";
                    if (value.id == req.body.cityId) { var selected = "selected" }
                    var temp = '<option value="' + value.id + '"' + selected + '>' + value.name + '</option>';
                    y.push(temp);
                });
                res.json(JSON.parse(JSON.stringify(y)));
            } else {
                res.json(JSON.parse(JSON.stringify(y)));
            }
        }).catch(function (err) {
            req.flash('error', ADMIN_MSG.CommonError);
            return res.redirect('/users');
        });
});


module.exports = router;
