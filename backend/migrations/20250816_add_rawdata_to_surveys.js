'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('surveys', 'rawData', {
      type: Sequelize.JSONB,
      allowNull: true,
      comment: 'Original raw survey data from KoboToolbox for preserving all question responses'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('surveys', 'rawData');
  }
};
