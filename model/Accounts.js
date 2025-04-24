cube('Accounts', {
  sqlTable: `fct_accounts`,
  shown: false,

  joins: {
    Licenses: {
      sql: `${CUBE}.id = ${Licenses}.account_id`,
      relationship: `one_to_many`,
    },
    Identities: {
      sql: `${CUBE}.user_id = ${Identities}.id`,
      relationship: `many_to_one`,
    },
  },

  measures: {
    count: {
      type: `count`,
      description: `Total number of accounts.`,
      drillMembers: [id, Identities.email],
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
    },
    userId: {
      // FK
      sql: `user_id`,
      type: `number`,
      shown: false,
    },
    appInstanceId: {
      // FK
      sql: `app_instance_id`,
      type: `number`,
      shown: false,
    },
    accountStatus: {
      sql: `account_status`,
      type: `string`,
      title: `Account Status`,
    },
    lastActivityDate: {
      sql: `last_activity_dt`, // Assumes DBT model provides this
      type: `time`,
      title: `Last Activity`,
    },
    isMatched: {
      sql: `is_matched`,
      type: `boolean`,
      title: `Is Matched to Identity`,
    },
    isAdmin: {
      sql: `is_admin`,
      type: `boolean`,
      title: `Is Admin`,
    },
    // Add account_sources dimension if needed
  },

  segments: {
    isInactive90Days: {
      sql: `${CUBE}.account_status = 'INACTIVE' AND ${CUBE}.last_activity_dt < datetime('now', '-90 days')`,
    },
    isInactive30Days: {
      sql: `${CUBE}.account_status = 'INACTIVE' AND ${CUBE}.last_activity_dt < datetime('now', '-30 days')`,
    },
  },
});
