const Sequelize = require('sequelize');

module.exports = (sequelize, type) => {
    var States = sequelize.define('states', {
        id: {
            type: Sequelize.INTEGER,
            primaryKey: true
        },
        name: {
            type: Sequelize.STRING,
            defaultValue: ''
        },
        country_id: {
            type: Sequelize.INTEGER
        }
    });

    States.sync().then(() => {
        // Table created
    });

    return States;
};


// User.sync({ force: true }).then(() => {
//   console.log('ok ... everything is nice!');
// }).catch(error => {
//   console.log('oooh, did you enter wrong database credentials?');
// });

