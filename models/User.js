const Sequelize = require('sequelize');

module.exports = (sequelize, type) => {
  var User = sequelize.define('user', {
    fname: {
      type: Sequelize.STRING
    },
    lname: {
      type: Sequelize.STRING
    },
    password: {
      type: Sequelize.STRING
    },
    email: {
      type: Sequelize.STRING,
      validate: { isEmail: true }
    },
    phone: {
      type: Sequelize.STRING,
      defaultValue: ''
    },
    gender: {
      type: Sequelize.STRING,
      defaultValue: ''
    },
    dob: {
      type: Sequelize.DATE,
      defaultValue: null
    },
    subcategory: {
      type: Sequelize.STRING,
      defaultValue: ''
    },
    state: {
      type: Sequelize.INTEGER,
        defaultValue: null,
        foreignKey: true
    },
    city: {
      type: Sequelize.INTEGER,
        defaultValue: null,
        foreignKey: true
    },
    access_token: {
      type: Sequelize.STRING,
      defaultValue: ''
    },
    user_type: {
      type: Sequelize.INTEGER,
      allowNull: true,
      validate: { isInt: true }
    },
    nif_number: {
      type: Sequelize.STRING,
      allowNull: true
    },
    user_image: {
      type: Sequelize.STRING,
      defaultValue: ''
    },
    fb_id: {
      type: Sequelize.STRING,
      defaultValue: ''
    },
    fb_image: {
        type: Sequelize.STRING,
      defaultValue: ''
    },
    fb_link: {
        type: Sequelize.STRING,
      defaultValue: ''
    },
    google_id: {
      type: Sequelize.STRING,
      defaultValue: ''
    },
    latitude: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
      validate: { min: -90, max: 90 }
    },
    longitude: {
      type: Sequelize.STRING,
      allowNull: true,
      defaultValue: null,
      validate: { min: -180, max: 180 }
    },
    device_type: {
      type: Sequelize.STRING,
      defaultValue: ''
    },
    device_id: {
      type: Sequelize.STRING,
      defaultValue: ''
    },
    app_version: {
      type: Sequelize.STRING,
      defaultValue: ''
    },
    last_login: {
      type: Sequelize.DATE,
      defaultValue: Sequelize.NOW
    },
    allow_notificatoin : {
      type: Sequelize.BOOLEAN,
      defaultValue: true
    },
    isActive: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
      adminApproved: {
          type: Sequelize.BOOLEAN,
          allowNull: false,
          defaultValue: false
      },
    otp: {
      type: Sequelize.STRING,
      default: ""
    },
    otpExpDate: {
      type: Sequelize.DATE
    },
    status: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: true
    },
    welcome_coupon:{
      type: Sequelize.BOOLEAN,
      allowNull: true,
      defaultValue: true
    },    
		location: {
      type: Sequelize.STRING,
      defaultValue: ''
    },
    email_verification_code: {
      type: Sequelize.STRING,
      defaultValue: ''
    },
    email_verified: {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false
    },
		user_lang: {
      type: Sequelize.STRING,
      defaultValue: 'en'
    },
    createdAt: Sequelize.DATE,
    updatedAt: Sequelize.DATE,
  }, {
      validate: {
        bothCoordsOrNone() {
          if ((this.latitude === null) !== (this.longitude === null)) {
            throw new Error('Require either both latitude and longitude or neither')
          }
        }
      }
    });

  User.sync().then(() => {
    // Table created    
  });

  return User;
};


// User.sync({ force: true }).then(() => {
//   console.log('ok ... everything is nice!');
// }).catch(error => {
//   console.log('oooh, did you enter wrong database credentials?');
// });

