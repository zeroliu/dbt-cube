cube('Identities', {
  sqlTable: `dim_identities`, // Direct table name instead of DBT ref
  shown: false,
  joins: {
    Managers: {
      // Self-join for manager hierarchy/name
      sql: `${CUBE}.manager_id = ${Managers}.id`,
      relationship: `one_to_many`,
    },
    Accounts: {
      sql: `${CUBE}.id = ${Accounts}.user_id`,
      relationship: `one_to_many`,
    },
  },

  measures: {
    count: {
      type: `count`,
      description: `Total number of identities defined in the dimension.`,
    },
  },

  dimensions: {
    id: {
      sql: `id`,
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
      // subQuery: true, // Indicates this comes from a joined cube
      title: `Manager Name`,
    },
    identityType: {
      sql: `identity_type`,
      type: `string`,
      title: `Identity Type`,
    },
  },

  segments: {},
});

// Alias for the self-join
cube('Managers', {
  shown: false,
  extends: Identities,
});
