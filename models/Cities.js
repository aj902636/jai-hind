const Sequelize = require('sequelize');

module.exports = (sequelize, type) => {
    var Cities = sequelize.define('cities', {
        name: {
            type: Sequelize.STRING
        },
        state_id: {
            type: Sequelize.INTEGER
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
    });

    Cities.sync().then(() => {
        // Table created
    });

    return Cities;
};


// User.sync({ force: true }).then(() => {
//   console.log('ok ... everything is nice!');
// }).catch(error => {
//   console.log('oooh, did you enter wrong database credentials?');
// });

