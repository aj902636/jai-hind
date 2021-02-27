const Sequelize = require('sequelize');

module.exports = (sequelize, type) => {
    var NotificationsStatus = sequelize.define('notifications_status', {
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
        user_id: {
            type: Sequelize.INTEGER,
           // defaultValue: ''
        },
        read_status:{
            type: Sequelize.BOOLEAN,
            allowNull: true,
            defaultValue: false
        },
        status: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
    },{
        tableName: 'notifications_status'
    });

    NotificationsStatus.sync().then(() => {
        // Table created
    });

    return NotificationsStatus;
};


// User.sync({ force: true }).then(() => {
//   console.log('ok ... everything is nice!');
// }).catch(error => {
//   console.log('oooh, did you enter wrong database credentials?');
// });

