const Sequelize = require('sequelize');
module.exports = (sequelize, type) => {
    var Stores = sequelize.define('stores', {
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            validate: { isInt: true }
        },
        store_name: {
            type: Sequelize.STRING,
            defaultValue: ''
        },
        store_location: {
            type: Sequelize.STRING,
            defaultValue: ''
        },
        store_manager: {
            type: Sequelize.STRING,
            defaultValue: ''
        },
        store_email: {
            type: Sequelize.STRING,
            validate: { isEmail: true }
        },
        store_password: {
            type: Sequelize.STRING
        },
        latitude: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
            validate: {min: -90, max: 90}
        },
        longitude: {
            type: Sequelize.STRING,
            allowNull: true,
            defaultValue: null,
            validate: {min: -180, max: 180}
        },
        street_address: {
            type: Sequelize.STRING,
            defaultValue: ''
        },
        town_city: {
            type: Sequelize.STRING,
            defaultValue: ''
        },
        isActive: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        status: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        user_lang: {
            type: Sequelize.STRING,
            defaultValue: 'en'
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
    });

    Stores.sync().then(() => {
        // Table created            
    });

    return Stores;
};
