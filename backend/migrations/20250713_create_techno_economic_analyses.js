module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.createTable('techno_economic_analyses', {
      id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER,
      },
      facilityId: {
        allowNull: false,
        type: Sequelize.INTEGER,
        references: {
          model: 'facilities',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      dailyUsage: {
        allowNull: false,
        type: Sequelize.FLOAT,
      },
      peakHours: {
        allowNull: false,
        type: Sequelize.FLOAT,
      },
      pvInitialCost: {
        allowNull: false,
        type: Sequelize.FLOAT,
      },
      pvAnnualMaintenance: {
        allowNull: false,
        type: Sequelize.FLOAT,
      },
      pvLifecycleCost: {
        allowNull: false,
        type: Sequelize.FLOAT,
      },
      pvNpv: {
        allowNull: false,
        type: Sequelize.FLOAT,
      },
      pvIrr: {
        allowNull: false,
        type: Sequelize.FLOAT,
      },
      dieselInitialCost: {
        allowNull: false,
        type: Sequelize.FLOAT,
      },
      dieselAnnualMaintenance: {
        allowNull: false,
        type: Sequelize.FLOAT,
      },
      dieselLifecycleCost: {
        allowNull: false,
        type: Sequelize.FLOAT,
      },
      dieselNpv: {
        allowNull: false,
        type: Sequelize.FLOAT,
      },
      dieselIrr: {
        allowNull: false,
        type: Sequelize.FLOAT,
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE,
      },
    });
  },
  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('techno_economic_analyses');
  },
};
