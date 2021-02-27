const Sequelize = require('sequelize');

module.exports = (sequelize, type) => {
    var Uninterested = sequelize.define('not_interested_coupons', {
        user_id: {
            type: Sequelize.INTEGER,
            isInt: true,
            allowNull: false
        },
        couponId: {
            type: Sequelize.INTEGER
        },
        createdAt: Sequelize.DATE,
    });

    Uninterested.sync().then(() => {
        // Table created
    });

    return Uninterested;
};


// User.sync({ force: true }).then(() => {
//   console.log('ok ... everything is nice!');
// }).catch(error => {
//   console.log('oooh, did you enter wrong database credentials?');
// });

