const Sequelize = require('sequelize');
module.exports = (sequelize, type) => {
    var Redeemed = sequelize.define('redeemed', {
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        title: {
            type: Sequelize.STRING,
            defaultValue: ''
        },
        description: {
            type: Sequelize.STRING,
            defaultValue: ''
        },
        couponId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        coupon_code: {
            type: Sequelize.STRING
        },
        storeId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        items: {
            type: Sequelize.STRING,
            defaultValue: ''
        },
        max_users: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        discount: {
            type: Sequelize.STRING,

        },
        original_price: {
            type: Sequelize.STRING
        },
        final_price: {
            type: Sequelize.STRING
        },
        start_date: {
            type: Sequelize.DATE
        },
        end_date: {
            type: Sequelize.DATE
        },
        status: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
    });

    Redeemed.sync().then(() => {
        // Table created
    });

    return Redeemed;
};
