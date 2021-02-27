const Sequelize = require('sequelize');

module.exports = (sequelize, type) => {
    var StoreRating = sequelize.define('store_rating', {
        user_id: {
            type: Sequelize.INTEGER,
            isInt: true,
            allowNull: false,
        },
        coupon_id : {
            type : Sequelize.INTEGER,
            allowNull : true,
        },
        storeId : {
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

    StoreRating.sync().then(() => {
        // Table created
    });

    return StoreRating;
};


