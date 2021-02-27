var express = require('express');
var router = express.Router();
global.Models = require('../../models');
var Users = Models.User;
var States = Models.States;
var Cities = Models.Cities
var Stores = Models.Stores;
var Subcategories = Models.Subcategories;
var Categories = Models.Categories;
var SubscriptionStatus = Models.SubscriptionStatus;

global.FUNC = require('../../functions/functions.js');


/*----> All Subscribe listing <----*/
router.get('/', FUNC.Auth, function (req, res, next) {
    var current_date = moment().format("YYYY-MM-DD");

    console.log(req.query.status)
    var status = req.query.status;
    var days = req.query.dayDuration;
    var updated_date = moment(current_date).subtract(days,'day').format("YYYY-MM-DD");
    console.log(updated_date)
    var query = '';
    if(status == 'active' && days != ''){
        query = "AND subscription_expire_date >= '"+current_date+"'"+"AND subscriptions.updatedAt > '"+updated_date+"'";
    }else if(status == 'inactive' && days != ''){
        query = "AND subscription_expire_date < '"+current_date+"'"+"AND subscriptions.updatedAt > '"+updated_date+"'";
    }else if(status == 'free'){
        query = "AND subscription_type = 'free'"+"AND subscriptions.updatedAt > '"+updated_date+"'";
    }else if(status == 'active'){
        query = "AND subscription_expire_date >= '"+current_date+"'";
    }else if(status == 'inactive'){
        query = "AND subscription_expire_date < '"+current_date+"'";
    }else if(status == 'free'){
        query = "AND subscription_type = 'free'";
    }
    const getTotal = sequelize.query("SELECT users.id,users.email,users.fname,users.lname,subscriptions.subscription_type,subscriptions.subscription_expire_date,subscriptions.subscription_start_date FROM `businesses` inner join users on businesses.userId = users.id inner join stores on businesses.userId = stores.userId INNER JOIN subscriptions ON businesses.userId = subscriptions.userId where users.status = 1  AND users.nif_number > 0 "+query+" Group By businesses.id", { type: sequelize.QueryTypes.SELECT
    }).then(results => {

        console.log("susbcribers==========================",results);
        res.render('users/subscribers', { userInfo: results,title: 'subscriber',moment:moment,status:status,days:days });
    }).catch(function (err) {
        console.log('catch', err);
        return res.redirect('/');
    });
});

router.get('/view/:id', async function(req, res, next){
    var user_id = req.params.id;
    console.log("user id"+user_id);
    const getSubscriptionStatus =  await SubscriptionStatus.findOne({where: {userId: user_id,},order: [['id', 'DESC']]});
    const storeData = await Stores.findAll({where: {status: true,id: {in: getSubscriptionStatus.store_id.split(',') },}});
    const categoryData = await Categories.findAll({where: {status: true,id: {in: getSubscriptionStatus.category_id.split(',') },}});

    const getTotal = sequelize.query(" SELECT users.id,users.phone,users.email,users.fname,users.lname,businesses.location,businesses.state,businesses.city,subscriptions.subscription_type,subscriptions.subscription_expire_date,subscriptions.subscription_start_date FROM `businesses` inner join users on businesses.userId = users.id inner join stores on businesses.userId = stores.userId INNER JOIN subscriptions ON businesses.userId = subscriptions.userId  where users.status = 1  AND users.nif_number > 0 AND businesses.userId = "+user_id+" Group By businesses.id", { type: sequelize.QueryTypes.SELECT
    }).then(results => {
        var StoreNameArr = [];
        storeData.forEach(element => {
            StoreNameArr.push(element.store_name);
        });
        var CategoryNameArr = [];
        categoryData.forEach(element => {
            CategoryNameArr.push(element.name);
        });
        console.log('dasdasd    '+StoreNameArr);
        console.log('sdfsdfsdfsdf '+CategoryNameArr);
        console.log('subscription status '+ getSubscriptionStatus)
        console.log("susbcribers==========================",results);
        res.render('users/invoice_details', { userInfo: results,getSubscriptionStatus:getSubscriptionStatus,StoreNameArr:StoreNameArr,CategoryNameArr:CategoryNameArr,title: 'subscriber',moment:moment});
    }).catch(function (err) {
        console.log('catch', err);
        return res.redirect('/');
    });
})

module.exports = router;