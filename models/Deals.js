const Sequelize = require('sequelize');
module.exports = (sequelize, type) => {
    var Deals = sequelize.define('deals', {
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
        status: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
    });

    Deals.sync().then(() => {
        // Table created     
    });

    return Deals;
};
