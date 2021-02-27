const Sequelize = require('sequelize');
module.exports = (sequelize, type) => {
    var Ads = sequelize.define('advertisement', {
        userId: {
            type: Sequelize.INTEGER,
            allowNull: false
        },
        title: {
            type: Sequelize.STRING,
            defaultValue: ''
        },
        link: {
            type: Sequelize.STRING,
            defaultValue: ''
        },
        duration: {
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
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
    });

    Ads.sync().then(() => {
        // Table created     
    });

    return Ads;
}
