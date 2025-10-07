'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    // First, update existing role values to new ones
    await queryInterface.sequelize.query(`
      UPDATE users SET role = 'non_technical' WHERE role = 'user';
    `);
    
    await queryInterface.sequelize.query(`
      UPDATE users SET role = 'technical_expert' WHERE role = 'manager';
    `);
    
    // Drop the existing ENUM constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS "users_role_check";
    `);
    
    // Change the column to use new ENUM values
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('admin', 'technical_expert', 'technical_junior', 'non_technical'),
      allowNull: false,
      defaultValue: 'non_technical'
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert role values back to old ones
    await queryInterface.sequelize.query(`
      UPDATE users SET role = 'user' WHERE role = 'non_technical';
    `);
    
    await queryInterface.sequelize.query(`
      UPDATE users SET role = 'user' WHERE role = 'technical_junior';
    `);
    
    await queryInterface.sequelize.query(`
      UPDATE users SET role = 'manager' WHERE role = 'technical_expert';
    `);
    
    // Drop the new ENUM constraint
    await queryInterface.sequelize.query(`
      ALTER TABLE users DROP CONSTRAINT IF EXISTS "users_role_check";
    `);
    
    // Change column back to old ENUM values
    await queryInterface.changeColumn('users', 'role', {
      type: Sequelize.ENUM('admin', 'manager', 'user'),
      allowNull: false,
      defaultValue: 'user'
    });
  }
};
