cube('AccountSnapshots', {
  sqlTable: `fact_account_snapshots`,

  joins: {
    Accounts: {
      sql: `${CUBE}.account_id = ${Accounts}.id`,
      relationship: `many_to_one`,
    },
    AppInstanceSnapshots: {
      sql: `${CUBE}.app_instance_id = ${AppInstanceSnapshots}.instance_id`,
      relationship: `many_to_one`,
    },
    IdentitySnapshots: {
      sql: `${CUBE}.account_id = ${IdentitySnapshots}.identity_id`,
      relationship: `many_to_one`,
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [id, effectiveFrom, effectiveTo, accountId, accountStatus],
    },
    currentAccountsCount: {
      type: `count`,
      filters: [{sql: `${CUBE}.is_current = 1`}],
      drillMembers: [id, effectiveFrom, accountId, accountStatus],
    },
    inactiveAccountsCount: {
      type: `count`,
      filters: [
        {sql: `${CUBE}.account_status = 'INACTIVE'`},
        {sql: `${CUBE}.is_current = 1`},
      ],
      drillMembers: [effectiveFrom, accountId, AppInstances.appName],
    },
    inactiveRatio: {
      type: `number`,
      sql: `CAST(${inactiveAccountsCount} AS FLOAT) / NULLIF(${currentAccountsCount}, 0)`,
      format: `percent`,
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
    },
    userId: {
      sql: `${Accounts.userId}`,
      type: `number`,
      shown: false,
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
    effectiveFrom: {
      sql: `effective_from`,
      type: `time`,
      title: `Effective From`,
    },
    effectiveTo: {
      sql: `effective_to`,
      type: `time`,
      title: `Effective To`,
    },
    isCurrent: {
      sql: `is_current`,
      type: `boolean`,
      title: `Is Current Record`,
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
    isInactive7Days: {
      sql: `date(${CUBE}.effective_from) > date(${CUBE}.last_activity_dt, '+7 days')`,
    },
    isInactive90Days: {
      sql: `date(${CUBE}.effective_from) > date(${CUBE}.last_activity_dt, '+90 days')`,
    },
    isInactive30Days: {
      sql: `date(${CUBE}.effective_from) > date(${CUBE}.last_activity_dt, '+30 days')`,
    },
    currentRecords: {
      sql: `${CUBE}.is_current = 1`,
    },
  },
});
