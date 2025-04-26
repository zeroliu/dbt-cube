cube('AccountSnapshots', {
  shown: false,
  sql: `
    SELECT
      a.*,
      d.full_date as snapshot_date
    FROM dim_dates d
    JOIN dim_account_snapshots a
      ON d.full_date >= a.effective_from
      AND d.full_date < a.effective_to
  `,
  title: 'Account Snapshots',

  joins: {
    Accounts: {
      sql: `${CUBE}.account_id = ${Accounts}.id`,
      relationship: `many_to_one`,
    },
    AppInstanceSnapshots: {
      sql: `${CUBE}.app_instance_id = ${AppInstanceSnapshots}.instance_id AND ${CUBE}.snapshot_date = ${AppInstanceSnapshots}.snapshot_date`,
      relationship: `many_to_one`,
    },
    IdentitySnapshots: {
      sql: `${CUBE}.user_id = ${IdentitySnapshots}.identity_id AND ${CUBE}.snapshot_date = ${IdentitySnapshots}.snapshot_date`,
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
    snapshotDate: {
      sql: `snapshot_date`,
      type: `time`,
      title: `Snapshot Date`,
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

  segments: {},
});
