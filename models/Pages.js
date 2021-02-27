const Sequelize = require('sequelize');

module.exports = (sequelize, type) => {
    var Pages = sequelize.define('pages', {
        user_id: {
            type: Sequelize.INTEGER,
            isInt: true,
            allowNull: false,
        },
        user_type: {
            type: Sequelize.INTEGER,
            allowNull: false,
        },
        slug: {
            type: Sequelize.STRING,
            defaultValue: ''
        },
        description: {
            type: Sequelize.TEXT,
            defaultValue: ''
        },
        description_pt: {
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

    Pages.sync().then(() => {
        // Table created          
    });

    return Pages;
}


// User.sync({ force: true }).then(() => {
//   console.log('ok ... everything is nice!');
// }).catch(error => {
//   console.log('oooh, did you enter wrong database credentials?');
// });

