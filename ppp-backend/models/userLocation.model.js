const db = require('../config/database');
const { DataTypes } = require('sequelize');

module.exports = (sequelize, Sequelize) => {
  const UserLocation = sequelize.define(
    'UserLocation',
    {
      id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
      },
      userId: {
        type: DataTypes.UUID,
        allowNull: false,
        unique: true, // Enforces the 1-to-1 relationship (one user, one location)
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      countryId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'countries',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      regionId: {
        type: DataTypes.UUID,
        allowNull: false,
        references: {
          model: 'regions',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      zoneId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'zones',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      woredaId: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'woredas',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      isActive: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      isDeleted: {
        type: DataTypes.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      },
      deletedAt: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      createdBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      updatedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      deletedBy: {
        type: DataTypes.UUID,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
    },
    {
      tableName: 'user_location',
      timestamps: true,
      underscored: true, // Ensures createdAt -> created_at, updatedAt -> updated_at
      freezeTableName: true, // Prevents Sequelize from pluralizing the table name
      // Since you are using a custom is_deleted flag instead of Sequelize's paranoid mode,
      // we map deletedAt explicitly and turn off default paranoid behavior.
      paranoid: false, 
      defaultScope: {
        // By default, only fetch records that are not soft-deleted
        where: {
          isDeleted: false,
        },
      },
      scopes: {
        withDeleted: {
          where: {},
        },
      },
      indexes: [
        {
          name: 'user_location_pkey',
          fields: [{ name: 'id' }],
          unique: true,
        },
        {
          name: 'user_location_user_id_key',
          fields: [{ name: 'userId' }], // or 'user_id' depending on Sequelize version mapping
          unique: true,
        },
      ],
    }
  );

  // Note: The database level CHECK constraint `chk_not_both_deleted_user_loc` 
  // will automatically protect data integrity at the Postgres level.

  return UserLocation;
};