const Sequelize = require('sequelize');
module.exports = (sequelize, type) => {
    var Coupons = sequelize.define('coupons', {
        categoryId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        subcategoryId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
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
        image: {
            type: Sequelize.STRING,
            defaultValue: ''
        },
        storeId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        // templateId: {
        //     type: Sequelize.INTEGER,
        //     allowNull: false
        // },
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
        coupon_duration: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        isSpecial: {
            type: Sequelize.BOOLEAN,
            defaultValue: false
        },
        isActive: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        blockAdmin: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: false
        },
        automated: {
            type: Sequelize.BOOLEAN,
            allowNull: true,
            defaultValue: 0
        },
        created_by: {
            type: Sequelize.STRING,
            defaultValue: "business"
        },
        status: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
    });

    Coupons.sync().then(() => {
        // Table created
    });

    return Coupons;
};
