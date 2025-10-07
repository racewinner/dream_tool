import { QueryInterface, DataTypes } from 'sequelize';

module.exports = {
  up: async (queryInterface: QueryInterface) => {
    // Update user roles to match the new role names
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET role = 
        CASE 
          WHEN role = 'ADMIN' THEN 'admin'
          WHEN role = 'MANAGER' THEN 'technical_expert'
          WHEN role = 'ANALYST' THEN 'technical_junior'
          WHEN role = 'USER' THEN 'non_technical'
          ELSE role
        END
      WHERE role IN ('ADMIN', 'MANAGER', 'ANALYST', 'USER');
    `);

    console.log('✅ Successfully updated user roles');
  },

  down: async (queryInterface: QueryInterface) => {
    // Revert the changes if needed
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET role = 
        CASE 
          WHEN role = 'admin' THEN 'ADMIN'
          WHEN role = 'technical_expert' THEN 'MANAGER'
          WHEN role = 'technical_junior' THEN 'ANALYST'
          WHEN role = 'non_technical' THEN 'USER'
          ELSE role
        END
      WHERE role IN ('admin', 'technical_expert', 'technical_junior', 'non_technical');
    `);

    console.log('✅ Successfully reverted user roles');
  }
};
