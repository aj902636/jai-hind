const Sequelize = require('sequelize');

module.exports = (sequelize, type) => {
    var Interested = sequelize.define('interested_coupons', {
        user_id: {
            type: Sequelize.INTEGER,
            isInt: true,
            allowNull: false
        },
        couponId: {
            type: Sequelize.INTEGER
        },
        coupon_code: {
            type: Sequelize.STRING
        },
        createdAt: Sequelize.DATE,
    });

    Interested.sync().then(() => {
        // Table created
    });

    return Interested;
};


// User.sync({ force: true }).then(() => {
//   console.log('ok ... everything is nice!');
// }).catch(error => {
//   console.log('oooh, did you enter wrong database credentials?');
// });

