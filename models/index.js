/* global sequelize, Config */


//initialize database connection
// global.sequelize = new Sequelize('kupon', 'root', 'root',
//     {
//         dialect: 'mysql',
//         logging: console.log,
//         define: {
//             underscored: true,
//             timestamps: false
//         }
//     }
// );

//Checking connection status
sequelize.authenticate().then(function () {
    console.log('Connection has been established successfully');
}).catch(function (err) {
    console.error('Unable to connect to the database:', err);
}).done();
// load models
var models = [
    'User',
    'Pages',
    'Categories',
    'Subcategories',
    'Prices',
    'Stores',
    'Deals',
    'Ads',
    'Business',
    'Coupons',
    'States',
    'Cities',
    'Uninterested',
    'Interested',
    'Reports',
    'Notifications',
    'NotificationsStatus',
    'Redeemed',
    'Subscription',
    'SubscriptionStatus',
    'Transactions',
    'couponRating',
    'storeRating',
    'Cities',
    'paymentMessage',
];
models.forEach(function (model) {
    module.exports[model] = sequelize.import(__dirname + '/' + model);
});

// describe relationships
(function (m) {
    m.Subcategories.belongsTo(m.Categories);
    m.Deals.belongsTo(m.Subcategories);
    m.Deals.belongsTo(m.Categories);
    m.Deals.belongsTo(m.User);
    m.Stores.belongsTo(m.User);
    m.User.hasMany(m.Stores);
    m.Coupons.belongsTo(m.Subcategories);
    m.Coupons.belongsTo(m.Categories);
    m.Coupons.belongsTo(m.User);
    m.Coupons.belongsTo(m.Stores);
    m.Stores.hasMany(m.storeRating);
    m.storeRating.belongsTo(m.Stores);
    //m.Cities.belongsTo(m.State);
    m.Uninterested.belongsTo(m.Coupons);
    m.Interested.belongsTo(m.Coupons);
    m.Coupons.hasOne(m.Interested);
    m.Notifications.belongsTo(m.User);
    m.Redeemed.belongsTo(m.User);
    m.Business.belongsTo(m.User);
    m.User.hasOne(m.Business);
    m.Categories.hasMany(m.Subcategories);
    m.User.belongsTo(m.States, {as: 'state_name', foreignKey: 'state', targetKey: 'id'});
    m.User.belongsTo(m.Cities, {as: 'city_name', foreignKey: 'city', targetKey: 'id'});
    m.Reports.belongsTo(m.User, { foreignKey: 'user_id', targetKey: 'id' });
    m.Reports.belongsTo(m.Coupons, { foreignKey: 'coupon_id', targetKey: 'id' });
    m.couponRating.belongsTo(m.User, { foreignKey: 'user_id', targetKey: 'id' });

    m.Interested.belongsTo(m.User, { foreignKey: 'user_id', targetKey: 'id' });

    m.couponRating.belongsTo(m.Coupons, { foreignKey: 'coupon_id', targetKey: 'id' });
    m.storeRating.belongsTo(m.User, { foreignKey: 'user_id', targetKey: 'id' });
    m.storeRating.belongsTo(m.Coupons, { foreignKey: 'coupon_id', targetKey: 'id' });
    m.storeRating.belongsTo(m.Stores, { foreignKey: 'storeId', targetKey: 'id' });
    m.Redeemed.belongsTo(m.Stores);
    m.Redeemed.belongsTo(m.Coupons);
    m.Coupons.hasMany(m.Redeemed);
    m.Coupons.hasMany(m.Uninterested);
})(module.exports);

// export connection
module.exports.sequelize = sequelize;

