const Sequelize = require('sequelize');

module.exports = (sequelize, type) => {
    var paymantMessage = sequelize.define('payment_message', {
        user_id: {
            type: Sequelize.INTEGER,
            isInt: true,
            allowNull: false,
        },
        email: {
            type: Sequelize.STRING,
            defaultValue: "",
        },
        english_message: {
            type: Sequelize.TEXT,
            defaultValue : "",
        },
        spanish_message: {
            type: Sequelize.TEXT,
            defaultValue : "",
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
    });

    paymantMessage.sync().then(() => {
        // Table created
    });

    return paymantMessage;
}


// User.sync({ force: true }).then(() => {
//   console.log('ok ... everything is nice!');
// }).catch(error => {
//   console.log('oooh, did you enter wrong database credentials?');
// });

