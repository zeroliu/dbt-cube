cube('AccountSnapshots', {
  sqlTable: `fact_account_snapshots`,

  joins: {
    Accounts: {
      sql: `${CUBE}.account_id = ${Accounts}.id`,
      relationship: `many_to_one`,
    },
    AppInstances: {
      sql: `${CUBE}.app_instance_id = ${AppInstances}.id`,
      relationship: `many_to_one`,
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [id, snapshotDate, accountId, accountStatus],
    },
    inactiveAccountsCount: {
      type: `count`,
      filters: [{sql: `${CUBE}.account_status = 'INACTIVE'`}],
      drillMembers: [snapshotDate, accountId, AppInstances.appName],
    },
    inactiveRatio: {
      type: `number`,
      sql: `CAST(${inactiveAccountsCount} AS FLOAT) / NULLIF(${count}, 0)`,
      format: `percent`,
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
    },
    accountId: {
      sql: `account_id`,
      type: `number`,
      shown: true,
    },
    appInstanceId: {
      sql: `app_instance_id`,
      type: `number`,
      shown: false,
    },
    snapshotDate: {
      sql: `snapshot_date`,
      type: `time`,
    },
    accountStatus: {
      sql: `account_status`,
      type: `string`,
      title: `Account Status`,
    },
    lastActivityDate: {
      sql: `last_activity_dt`,
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
  },

  segments: {
    isInactive90Days: {
      sql: `${CUBE}.account_status = 'INACTIVE' AND date(${CUBE}.snapshot_date) > date(${CUBE}.last_inactivity_dt, '+90 days')`,
    },
    isInactive30Days: {
      sql: `${CUBE}.account_status = 'INACTIVE' AND date(${CUBE}.snapshot_date) > date(${CUBE}.last_inactivity_dt, '+30 days')`,
    },
  },
});
