cube('AppInstanceSnapshots', {
  shown: false,
  sql: `
    SELECT
      a.*,
      d.full_date as snapshot_date
    FROM dim_dates d
    JOIN dim_app_instance_snapshots a
      ON d.full_date >= a.effective_from
      AND d.full_date < a.effective_to
  `,
  title: 'App Instance Snapshots',
  joins: {
    Applications: {
      sql: `${CUBE}.app_id = ${Applications}.id`,
      relationship: `many_to_one`,
    },
    AccountSnapshots: {
      sql: `${CUBE}.instance_id = ${AccountSnapshots}.app_instance_id AND ${CUBE}.snapshot_date = ${AccountSnapshots}.snapshot_date`,
      relationship: `one_to_many`,
    },
  },

  measures: {
    count: {
      type: `count`,
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
    },
    instanceId: {
      sql: `instance_id`,
      type: `number`,
      shown: true,
    },
    appId: {
      sql: `app_id`,
      type: `number`,
      shown: false,
    },
    instanceStatus: {
      sql: `instance_status`,
      type: `string`,
      title: `App Instance Status`,
    },
    createdDate: {
      sql: `created_dt`,
      type: `time`,
      title: `Created Date`,
    },
    isShadowIt: {
      sql: `is_shadow_it`,
      type: `boolean`,
      title: `Is Shadow IT`,
    },
    appName: {
      sql: `${AppInstances.appName}`,
      type: `string`,
      title: `App Name`,
    },
    appCategory: {
      sql: `${AppInstances.appCategory}`,
      type: `string`,
      title: `App Category`,
    },
    snapshotDate: {
      sql: `snapshot_date`,
      type: `time`,
      title: `Snapshot Date`,
    },
  },

  segments: {},
});
