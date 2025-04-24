cube('AccountSnapshots', {
  sqlTable: `fact_account_snapshots`,
  title: 'Accounts',

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
      sql: `${CUBE}.user_id = ${IdentitySnapshots}.identity_id`,
      relationship: `many_to_one`,
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [
        id,
        IdentitySnapshots.email,
        IdentitySnapshots.fullName,
        AppInstanceSnapshots.appName,
        AppInstanceSnapshots.appCategory,
      ],
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
    },
    userId: {
      sql: `user_id`,
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
    currentRecords: {
      sql: `${CUBE}.is_current = 1`,
    },
  },
});
