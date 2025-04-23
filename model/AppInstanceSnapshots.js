cube('AppInstanceSnapshots', {
  sqlTable: `fact_app_instance_snapshots`,

  joins: {
    Applications: {
      sql: `${CUBE}.app_id = ${Applications}.id`,
      relationship: `many_to_one`,
    },
    AccountSnapshots: {
      sql: `${CUBE}.instance_id = ${AccountSnapshots}.app_instance_id`,
      relationship: `one_to_many`,
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [instanceId, effectiveFrom, effectiveTo, instanceStatus],
    },
    currentInstancesCount: {
      type: `count`,
      filters: [{sql: `${CUBE}.is_current = 1`}],
      drillMembers: [instanceId, effectiveFrom, instanceStatus],
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
  },

  segments: {
    currentRecords: {
      sql: `${CUBE}.is_current = 1`,
    },
  },
});
