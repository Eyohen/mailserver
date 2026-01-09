// "use strict";

// // models/merchant.js
// const { Model, UUIDV4 } = require("sequelize");

// module.exports = (sequelize, DataTypes) => {
//   class Merchant extends Model {
//     static associate(models) {
//       // Define associations here if needed
//     }
//   }

//   Merchant.init(
//     {
//       id: {
//         type: DataTypes.UUID,
//         defaultValue: UUIDV4,
//         primaryKey: true,
//       },
//       firstName: {
//         type: DataTypes.STRING,
//         allowNull: true,
//       },
//       lastName: {
//         type: DataTypes.STRING,
//         allowNull: true,
//       },
//       businessName: {
//         type: DataTypes.STRING,
//         allowNull: true,
//        // unique: true,
//       },
//       email: {
//         type: DataTypes.STRING,
//         allowNull: false,
//         unique: true,
//         validate: {
//           isEmail: true,
//         },
//       },
//       country: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       password: {
//         type: DataTypes.STRING,
//         allowNull: false,
//       },
//       role: {
//         type: DataTypes.STRING,
//         allowNull: false,
//         defaultValue: "user",
//       },
//       apiKey: {
//         type: DataTypes.STRING,
//         unique: true,
//         allowNull: true, 
//       },
//       verified: {
//         type: DataTypes.BOOLEAN,
//         defaultValue: false,
//       },
//       verificationToken: {
//         type: DataTypes.STRING,
//         allowNull: true,
//       },
//       resetPasswordOTP: {
//         type: DataTypes.STRING,
//         allowNull: true,
//       },
//       resetPasswordToken: {
//         type: DataTypes.STRING,
//         allowNull: true,
//       },

//       resetPasswordExpires: {
//         type: DataTypes.DATE,
//         allowNull: true,
//       },
//     },
//     {
//       sequelize,
//       modelName: "Merchant",
//     }
//   );

//   return Merchant;
// };



"use strict";
const { Model, UUIDV4 } = require("sequelize");

module.exports = (sequelize, DataTypes) => {
  class Merchant extends Model {
    static associate(models) {
      // A merchant has many chats
      Merchant.hasMany(models.Chat, {
        foreignKey: "merchantId",
        as: "chats",
      });
      
      // A merchant has many email transactions
      Merchant.hasMany(models.EmailTransaction, {
        foreignKey: "merchantId",
        as: "emailTransactions",
      });
      
      // A merchant has many notifications
      Merchant.hasMany(models.Notification, {
        foreignKey: "merchantId",
        as: "notifications",
      });

      // A merchant has many user presences (for their app users)
      Merchant.hasMany(models.UserPresence, {
        foreignKey: "merchantId",
        as: "userPresences",
      });

      // A merchant has many webhooks
      Merchant.hasMany(models.Webhook, {
        foreignKey: "merchantId",
        as: "webhooks",
      });
    }
  }

  Merchant.init(
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: UUIDV4,
        primaryKey: true,
      },
      firstName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      lastName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      businessName: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true,
        validate: {
          isEmail: true,
        },
      },
      country: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      role: {
        type: DataTypes.STRING,
        allowNull: false,
        defaultValue: "user",
      },
      apiKey: {
        type: DataTypes.STRING,
        unique: true,
        allowNull: true,
      },
      verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      verificationToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetPasswordOTP: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetPasswordToken: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      resetPasswordExpires: {
        type: DataTypes.DATE,
        allowNull: true,
      },
    },
    {
      sequelize,
      modelName: "Merchant",
    }
  );

  return Merchant;
};