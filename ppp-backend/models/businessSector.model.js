const db = require('../config/database');
const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const BusinessSector = sequelize.define(
    'BusinessSector',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      engName: {
        type: DataTypes.STRING(150),
        allowNull: false,
        unique: true,
        field: 'eng_name',
      },
      amhName: {
        type: DataTypes.STRING(150),
        allowNull: true,
        field: 'amh_name',
      },
      oroName: {
        type: DataTypes.STRING(150),
        allowNull: true,
        field: 'oro_name',
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        field: 'is_active',
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        field: 'is_deleted',
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
        field: 'deleted_at',
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'created_by',
      },
      updatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'updated_by',
      },
      deletedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        field: 'deleted_by',
      },
    },
    {
      tableName: 'business_sectors',
      timestamps: true,
      underscored: true,
      freezeTableName: true,
      paranoid: false,
      defaultScope: {
        where: {
          isDeleted: false,
        },
      },
      scopes: {
        withDeleted: {
          where: {},
        },
      },
    }
  );

  return BusinessSector;
};