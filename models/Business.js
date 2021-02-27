const Sequelize = require('sequelize');

module.exports = (sequelize, type) => {
    var Business = sequelize.define('business', {
        userId: {
            type: Sequelize.INTEGER
        },
        categoryId: {
            type: Sequelize.STRING,
            defaultValue: null
        },
        business_name: {
            type: Sequelize.STRING
        },
        no_of_stores: {
            type: Sequelize.INTEGER
        },
        location: {
            type: Sequelize.STRING
        },
        state: {
            type: Sequelize.STRING,
              defaultValue: null,              
          },
        city: {
            type: Sequelize.STRING,
              defaultValue: null,             
          },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
    });

    Business.sync().then(() => {
        // Table created            
    });

    return Business;
}

