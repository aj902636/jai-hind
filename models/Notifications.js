const Sequelize = require('sequelize');

module.exports = (sequelize, type) => {
    var Notifications = sequelize.define('notifications', {
        userId: {
            type: Sequelize.INTEGER,
            isInt: true,
            allowNull: false,
        },
        couponId: {
            type: Sequelize.INTEGER,
            isInt: true,
            allowNull: false,
        },
        message: {
            type: Sequelize.TEXT,
            defaultValue: ''
        },
        end_date: {
            type: Sequelize.DATE
        },
        noti_type: {
            type: Sequelize.TEXT,
            defaultValue: ''
        },
        user_ids: {
            type: Sequelize.TEXT,
            defaultValue: ''
        },
        status: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
    });

    Notifications.sync().then(() => {
        // Table created
    });

    return Notifications;
};


// User.sync({ force: true }).then(() => {
//   console.log('ok ... everything is nice!');
// }).catch(error => {
//   console.log('oooh, did you enter wrong database credentials?');
// });

