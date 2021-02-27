var express = require('express');
var router = express.Router();
global.Models = require('../../models');
var Users = Models.User;
var States = Models.States;
var Cities = Models.Cities
var Subcategories = Models.Subcategories;
global.FUNC = require('../../functions/functions.js');


/*----> All Subscribe listing <----*/
router.get('/subscribers', FUNC.Auth, function (req, res, next) {
    var current_date = moment().format("YYYY-MM-DD");
    var user_id = req.session.user.id;
    const getTotal = sequelize.query("SELECT users.email,users.fname,users.lname,subscriptions.subscription_type,subscriptions.subscription_expire_date,subscriptions.subscription_start_date FROM `subscriptions`  INNER JOIN users  ON subscriptions.userId = users.id  ORDER BY `userId` ASC", { type: sequelize.QueryTypes.SELECT

    }).then(results => {
        console.log("susbcribers==========================",results);
        res.render('users/subscribers', { userInfo: results,title: 'subscriber',moment:moment });
    }).catch(function (err) {
        console.log('catch', err);
        return res.redirect('/');
    });
});
/*----> All Users listing <----*/
router.get('/', FUNC.Auth, function (req, res, next) {
    const stateId  = req.body.stateId;
    sequelize.query("SELECT cities.*,states.name as state_name FROM cities as cities LEFT OUTER JOIN states AS states ON cities.state_id = states.`id` ORDER BY cities.name ASC",
     { type: sequelize.QueryTypes.SELECT })
    .then(cities => {
        console.log(cities);
		res.render('city/index', { cities: cities, title: 'Kupon City' });
	}).catch(function (err) {
		console.log('catch', err);
        return res.redirect('/');
	});
});


/*-------> Edit User By ID  <----------*/
router.get('/add', FUNC.Auth, function (req, res, next) {
    States.findAll({
		attributes: ['id', 'name'],
		order: [['name', 'ASC']],
		raw: true,
	}).then(states => {
		res.render('city/add', { states : states, title: 'City || Add' });
	}).catch(function (err) {
		console.log('catch', err);
        return res.redirect('/');
	});
});

/*-------> Edit User By ID  <----------*/
router.post('/add', FUNC.Auth, function (req, res, next) {
    Cities.findAll({
		attributes: ['cities.*'],
		where: { state_id: req.body.stateId,name:req.body.city_name },
		order: [['name', 'ASC']],
		raw: true,
	}).then(cities2 => {
		if(cities2.length <= 0){
			console.log(cities2)
			var cityData = {
				name: req.body.city_name,
				state_id: req.body.stateId
            };
            Cities.create(cityData).then(result => {
                req.flash('success', "City added successfully");
                res.redirect('/city');
			}).catch( function(err){
				req.flash('error', "Something want's worngs");
                return res.redirect('/city');
			})
		}else{
            req.flash('error', "Ciity already added !");
            res.redirect('/city');
		}
	}).catch(function (err) {
		req.flash('error', "Something want's worngs");
        return res.redirect('/city');
    });


});

/*-------> Edit User By ID  <----------*/
router.get('/edit/:id', FUNC.Auth, function (req, res, next) {
    Cities.findOne({
        where: { id: req.params.id},
    }).then(results => {
        sequelize.query("SELECT * FROM `states`", { type: sequelize.QueryTypes.SELECT })
            .then(states => {
                res.render('city/edit', { cityInfo: results, states, title: 'city' });
            });
    }).catch(function (err) {
        req.flash('error', 'Something went wrong.');
        return res.redirect('/users');
    });
});

/*-------> View User By ID  <----------*/
router.get('/view/:id', FUNC.Auth, function (req, res, next) {
    Users.findOne({
        where: { id: req.params.id, user_type: 3 },
        include:[
            {
				model: States,
				as: 'state_name',
				attributes: ['id', 'name'],
            },
            {
				model: Cities,
				as: 'city_name',
				attributes: ['id', 'name'],
			},


        ]
    }).then(async function(results) {
        //console.log(results);
        //console.log( results.city_name.name)
        let subCategoiesIds = results.subcategory.split(",");
        var subcateories = await Subcategories.findOne({ where: { id: { $in: JSON.parse("[" + subCategoiesIds + "]") } }, attributes: [[sequelize.fn('GROUP_CONCAT', sequelize.col('name')), 'subcategories']], raw: true });
        console.log("subcateories=================",subcateories)
        results.subcategory = subcateories.subcategories
        console.log(results.subcategory);
        res.render('users/view', { userInfo: results, title: 'users',moment:moment });
    }).catch(function (err) {
        console.log(err);
        req.flash('error', 'Something went wrong.');
      //  return res.redirect('/users');
    });
});

/*-------> Update User  <----------*/
router.post('/edit/:id', FUNC.Auth, function (req, res, next) {
    var cityData = {
        name: req.body.city_name,
        state_id: req.body.stateId,
        createdAt: new Date(),
    };
    Cities.update(cityData, {
        where: { id: req.params.id }
    }).then(result => {
        req.flash('success', 'City updated successfully');
        res.redirect('/city');
    }).catch(function (err) {
        req.flash('error', 'Something went wrong.');
        return res.redirect('/city');
    });


});

/*-------> Delete User  <----------*/
router.get('/delete/:id', FUNC.Auth, function (req, res, next) {
    //console.log("DELETE FROM `cities` WHERE `cities`.`id` = "+req.params.id);
    sequelize.query("DELETE FROM `cities` WHERE `cities`.`id` = "+req.params.id, { type: sequelize.QueryTypes.DELETE }).then(result => {
        console.log(result)
        req.flash('success', 'City removed successfully');
        res.redirect('/city');
    }).catch(function (err) {
        console.log(err);
        req.flash('error', 'Something went wrong.');
        return res.redirect('/city');
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
    sequelize.query("SELECT * FROM `cities` WHERE `state_id`=:state_id ORDER BY name", { replacements: { state_id: req.body.id } },
        { type: sequelize.QueryTypes.SELECT })
        .spread(cities => {
            var y = new Array('<option value="">-- Select Comunas --</option>');
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
            req.flash('error', 'Something went wrong.');
            return res.redirect('/users');
        });
});


module.exports = router;
