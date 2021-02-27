const Sequelize = require('sequelize');
module.exports = (sequelize, type) => {
    var Subcategories = sequelize.define('subcategories', {
        name: {
            type: Sequelize.STRING,
            defaultValue: ''
        },
        categoryId: {
            type: Sequelize.INTEGER,
            allowNull: false,
            validate: { isInt: true }
        },
        icon: {
            type: Sequelize.STRING,
            defaultValue: ''
        },
        isActive: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        status: {
            type: Sequelize.BOOLEAN,
            allowNull: false,
            defaultValue: true
        },
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
    },
        {
            instanceMethods: {
                getFullName: function () {
                    var imageUrl = 'http://192.168.0.224:8878/uploads/cats/';
                    return imageUrl + this.icon;
                }
            }
        });

    Subcategories.sync().then(() => {
        // Table created    
    });

    return Subcategories;
}
