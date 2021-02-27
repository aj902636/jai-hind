const Sequelize = require('sequelize');

module.exports = (sequelize, type) => {
    var Prices = sequelize.define('prices', {
        price_per_cat: {
            type: Sequelize.INTEGER,
            isInt: true,
            allowNull: false,
        },
        price_per_store: {
            type: Sequelize.INTEGER,
            isInt: true,
            allowNull: false,
        },
        vat_price: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
    });

    Prices.sync().then(() => {
        // Table created
    });

    return Prices;
}


// User.sync({ force: true }).then(() => {
//   console.log('ok ... everything is nice!');
// }).catch(error => {
//   console.log('oooh, did you enter wrong database credentials?');
// });

