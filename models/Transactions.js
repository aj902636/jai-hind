const Sequelize = require('sequelize');

module.exports = (sequelize, type) => {

   
    var Transactions = sequelize.define('transactions', {
        userId: {
            type: Sequelize.INTEGER
        },
        
        paid_amount: {
            type: Sequelize.FLOAT,
        },
        reference_id: {
            type: Sequelize.STRING,       
        },
        transaction_id: {
            type: Sequelize.STRING, 
        },  
        payment_id: {
            type: Sequelize.STRING, 
        }, 
        subscriptions_status_id :{
            type: Sequelize.INTEGER        
        },     
        createdAt: Sequelize.DATE,
        updatedAt: Sequelize.DATE,
    },{
        tableName: 'transactions'
    })
    Transactions.sync().then(() => {
        // Table created    
      });
 

  

    return Transactions;
}

