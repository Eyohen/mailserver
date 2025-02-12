'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Owners" 
      DROP COLUMN review;
      
      ALTER TABLE "Owners" 
      ADD COLUMN review VARCHAR(255)[];
    `);
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.sequelize.query(`
      ALTER TABLE "Owners" 
      DROP COLUMN review;
      
      ALTER TABLE "Owners" 
      ADD COLUMN review VARCHAR(255);
    `);
  }
};