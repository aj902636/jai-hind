const Sequelize = require('sequelize');

module.exports = (sequelize, type) => {


    var SubscriptionStatus = sequelize.define('subscriptions_status', {
        userId: {
            type: Sequelize.INTEGER
        },
        sub_amount: {
            type: Sequelize.FLOAT,

        },
        paid_amount: {
            type: Sequelize.FLOAT,
        },
        reference_id: {
            type: Sequelize.STRING,
        },
        payment_status: {
            type: Sequelize.STRING,
        },
        payment_response: {
            type: Sequelize.STRING,
        },
        payment_method : {
            type : Sequelize.STRING,
            defaultValue : null,
        },
        vat_amount : {
            type : Sequelize.FLOAT
        },
        store_id : {
            type : Sequelize.STRING,
            defaultValue : "",
        },
        category_id : {
            type : Sequelize.STRING,
            defaultValue : "",
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
    },{
        tableName: 'subscriptions_status'
    })
    SubscriptionStatus.sync().then(() => {
        // Table created
      });




    return SubscriptionStatus;
}

