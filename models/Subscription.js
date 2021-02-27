const Sequelize = require('sequelize');
const { isNull } = require('lodash');

module.exports = (sequelize, type) => {
    var Subscription = sequelize.define('subscriptions', {
        userId: {
            type: Sequelize.INTEGER
        },
        no_of_days: {
            type: Sequelize.INTEGER,
            defaultValue: 30
        },
        subscription_type: {
            type: Sequelize.ENUM('free','paid'),
            defaultValue: "free"
        },
        subscription_start_date: {
            type: Sequelize.DATEONLY,
          //  defaultValue:Sequelize.DATE
        },
        subscription_expire_date: {
            type: Sequelize.DATEONLY,
           // defaultValue:Sequelize.DATE
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
    })
    Subscription.sync().then(() => {
        // Table created
      });

  /*     Subscription.Library.belongsTo(models.User, {
        foreignKey: 'userId'
    }) */



    return Subscription;
}

