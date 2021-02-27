const Sequelize = require('sequelize');

module.exports = (sequelize, type) => {
    var CouponRating = sequelize.define('coupon_rating', {
        user_id: {
            type: Sequelize.INTEGER,
            isInt: true,
            allowNull: false,
        },
        coupon_id : {
            type : Sequelize.INTEGER,
            allowNull : true,
        },
        user_type: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        rating: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        message: {
            type: Sequelize.TEXT,
            defaultValue: ''
        },
        admin_read: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        status: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
    });

    CouponRating.sync().then(() => {
        // Table created
    });

    return CouponRating;
};


