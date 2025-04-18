cube('Users', {
  sqlTable: `dim_users`, // Direct table name instead of DBT ref

  joins: {
    Managers: {
      // Self-join for manager hierarchy/name
      sql: `${Users}.manager_id = ${Managers}.user_id`,
      relationship: `belongsTo`,
    },
  },

  measures: {
    count: {
      type: `count`,
      description: `Total number of users defined in the dimension.`,
    },
  },

  dimensions: {
    userId: {
      sql: `user_id`,
      type: `number`,
      primaryKey: true,
      shown: true, // Often useful to show IDs for debugging/linking
    },
    email: {
      sql: `email`,
      type: `string`,
    },
    fullName: {
      sql: `full_name_precomputed`,
      type: `string`,
      title: `Full Name`,
    },
    team: {
      sql: `team`,
      type: `string`,
    },
    status: {
      sql: `status`,
      type: `string`,
      title: `User Status`,
    },
    startDate: {
      sql: `start_date`,
      type: `time`,
      title: `Start Date`,
    },
    endDate: {
      sql: `end_date`,
      type: `time`,
      title: `End Date`,
    },
    managerId: {
      sql: `manager_id`,
      type: `number`,
      shown: false, // Hide FK by default
    },
    managerName: {
      sql: `${Managers.fullName}`,
      type: `string`,
      subQuery: true, // Indicates this comes from a joined cube
      title: `Manager Name`,
    },
    // Consider adding identity_type if relevant
  },

  segments: {
    activeUsers: {
      sql: `${CUBE}.status = 'ACTIVE'`,
    },
    inactiveUsers: {
      sql: `${CUBE}.status != 'ACTIVE' OR (${CUBE}.end_date IS NOT NULL AND ${CUBE}.end_date <= NOW())`,
    },
  },
});

// Alias for the self-join
cube('Managers', {
  extends: Users,
});
