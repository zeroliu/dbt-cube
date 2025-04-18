cube('Accounts', {
  sqlTable: `fct_accounts`,

  joins: {
    Users: {
      sql: `${CUBE}.user_id = ${Users}.user_id`,
      relationship: `belongsTo`,
    },
    DomainApplications: {
      sql: `${CUBE}.domain_app_id = ${DomainApplications}.domain_app_id`,
      relationship: `belongsTo`,
    },
    ContractLicenses: {
      sql: `${CUBE}.domain_app_id = ${ContractLicenses}.domain_app_id`,
      relationship: `hasMany`,
    },
    // Applications: { // Optional direct join if needed frequently without DomainApplications
    //   sql: `${DomainApplications.appId} = ${Applications.appId}`, // Requires joining through DomainApplications first in Cube
    //   relationship: `belongsTo`
    // }
    // Join to a Date Dimension on last_activity_dt / last_login_dt if created
  },

  measures: {
    count: {
      type: `count`,
      description: `Total number of accounts (user-app links).`,
      drillMembers: [accountId, Users.email, DomainApplications.instanceLabel],
    },
    userCount: {
      type: `countDistinct`,
      sql: `user_id`,
      description: `Number of distinct users with accounts.`,
      drillMembers: [Users.email, Users.fullName, Users.team],
    },
    activeAccountCount: {
      type: `count`,
      filters: [{sql: `${CUBE}.account_status = 'ACTIVE'`}],
      title: `Active Accounts`,
    },
    dormantAccountCount: {
      type: `count`,
      filters: [{sql: `${CUBE}.is_dormant = TRUE`}], // Requires is_dormant flag from DBT
      title: `Dormant Accounts`,
    },
    // Total inactive licenses attributed to this team (through their application usage)
    inactiveLicensesByTeam: {
      type: `sum`,
      sql: `CASE
              WHEN ${ContractLicenses.purchasedQuantity} > ${ContractLicenses.usedQuantity}
              THEN (${ContractLicenses.purchasedQuantity} - ${ContractLicenses.usedQuantity})
              ELSE 0
            END *
            (${CUBE.activeAccountCount} / NULLIF(${DomainApplications.activeAccountsCount}, 0))`,
      title: `Inactive Licenses by Team`,
      description: `Inactive licenses attributed to teams based on their proportion of app usage`,
    },
    // Cost of inactive licenses by team
    inactiveLicenseCostByTeam: {
      type: `sum`,
      sql: `${ContractLicenses.unusedLicenseCost} *
            (${CUBE.activeAccountCount} / NULLIF(${DomainApplications.activeAccountsCount}, 0))`,
      format: `currency`,
      title: `Inactive License Cost by Team`,
    },
  },

  dimensions: {
    accountId: {
      sql: `account_id`,
      type: `number`,
      primaryKey: true,
    },
    userId: {
      // FK
      sql: `user_id`,
      type: `number`,
      shown: false,
    },
    domainAppId: {
      // FK
      sql: `domain_app_id`,
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
    lastLoginDate: {
      sql: `last_login_dt`, // Assumes DBT model provides this
      type: `time`,
      title: `Last Login`,
    },
    isDormant: {
      sql: `is_dormant`, // Pre-calculated in DBT
      type: `boolean`,
      title: `Is Dormant?`,
    },
    // Add account_sources dimension if needed
  },

  segments: {
    activeAccounts: {
      sql: `${CUBE}.account_status = 'ACTIVE'`,
    },
    dormantAccounts: {
      sql: `${CUBE}.is_dormant = TRUE`, // Use pre-calculated flag
    },
    // Segment for accounts belonging to inactive users
    accountsOfInactiveUsers: {
      // This requires joining Users and checking their status
      sql: `${Users.status} != 'ACTIVE'`, // Add the missing sql property
    },
    // Segment for accounts in deprecated/blocklisted apps
    accountsInDeprecatedApps: {
      // Requires joining DomainApplications
      // Example usage: Accounts.count + DomainApplications.deprecatedOrBlocklisted segment
      sql: `${DomainApplications.domainAppStatus} IN ('DEPRECATED', 'BLOCKLISTED')`,
    },
  },

  // preAggregations: {
  //   // Rollup dormant accounts by user team and app category
  //   dormancyByUserTeamAppCategory: {
  //     type: `rollupJoin`,
  //     measureReferences: [Accounts.dormantAccountCount, Accounts.userCount],
  //     dimensionReferences: [Users.team, DomainApplications.finalCategory],
  //     segmentReferences: [Accounts.dormantAccounts, Users.activeUsers], // Dormant accounts of active users
  //     granularity: `month`,
  //     timeDimensionReference: Accounts.lastActivityDate, // Or lastLoginDate
  //   },
  //   // Rollup accounts by app and user status for license opt
  //   accountsByUserStatusApp: {
  //     type: `rollupJoin`,
  //     measureReferences: [Accounts.activeAccountCount, Accounts.userCount],
  //     dimensionReferences: [Users.status, DomainApplications.appName],
  //     segmentReferences: [Accounts.activeAccounts], // Active accounts...
  //     // No time dimension needed here unless tracking changes over time
  //   },
  //   // Add more pre-aggregations based on frequent dashboard queries
  // },
});
