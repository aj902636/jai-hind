const Sequelize = require('sequelize');

module.exports = (sequelize, type) => {
    var Reports = sequelize.define('reports', {
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
        subject: {
            type: Sequelize.STRING,
            defaultValue: ''
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

    Reports.sync().then(() => {
        // Table created
    });

    return Reports;
};


// User.sync({ force: true }).then(() => {
//   console.log('ok ... everything is nice!');
// }).catch(error => {
//   console.log('oooh, did you enter wrong database credentials?');
// });

