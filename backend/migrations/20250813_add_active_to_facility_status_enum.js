'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // Check if the new enum type already exists and drop it if it does
    await queryInterface.sequelize.query(`
      DO $$
      BEGIN
        IF EXISTS (SELECT 1 FROM pg_type WHERE typname = 'enum_facilities_status_new') THEN
          DROP TYPE IF EXISTS enum_facilities_status_new CASCADE;
        END IF;
      END
      $$;
    `);

    // Create a new type with the additional enum value
    await queryInterface.sequelize.query(
      "CREATE TYPE enum_facilities_status_new AS ENUM ('survey', 'design', 'installed', 'active')"
    );

    // Get the current default value
    const [results] = await queryInterface.sequelize.query(`
      SELECT column_default 
      FROM information_schema.columns 
      WHERE table_name = 'facilities' AND column_name = 'status';
    `);
    
    const currentDefault = results[0]?.column_default || "'survey'::enum_facilities_status_new";
    const newDefault = currentDefault.replace(/::enum_facilities_status(_new)?/g, "::enum_facilities_status_new");

    // Drop the default constraint first
    await queryInterface.sequelize.query(`
      ALTER TABLE "facilities" 
      ALTER COLUMN "status" DROP DEFAULT;
    `);

    // Then update the column to use the new type without the default
    await queryInterface.sequelize.query(`
      ALTER TABLE "facilities" 
      ALTER COLUMN "status" TYPE enum_facilities_status_new 
      USING ("status"::text::enum_facilities_status_new);
    `);

    // Add back the default value
    await queryInterface.sequelize.query(`
      ALTER TABLE "facilities" 
      ALTER COLUMN "status" SET DEFAULT ${newDefault};
    `);

    // Drop the old type if it exists
    await queryInterface.sequelize.query(`
      DROP TYPE IF EXISTS enum_facilities_status;
    `);

    // Rename the new type to the original name
    await queryInterface.sequelize.query(`
      ALTER TYPE enum_facilities_status_new RENAME TO enum_facilities_status;
    `);
  },

  down: async (queryInterface, Sequelize) => {
    // Revert the changes if needed
    await queryInterface.sequelize.query(
      "CREATE TYPE enum_facilities_status_old AS ENUM ('survey', 'design', 'installed')"
    );
    
    await queryInterface.sequelize.query(`
      ALTER TABLE "facilities" 
      ALTER COLUMN "status" TYPE enum_facilities_status_old 
      USING (CASE WHEN "status" = 'active' THEN 'survey' ELSE "status"::text END)::enum_facilities_status_old
    `);
    
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS enum_facilities_status');
    await queryInterface.sequelize.query('ALTER TYPE enum_facilities_status_old RENAME TO enum_facilities_status');
  }
};
