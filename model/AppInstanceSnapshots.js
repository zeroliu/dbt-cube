cube('AppInstanceSnapshots', {
  sqlTable: `fact_app_instance_snapshots`,

  joins: {
    AppInstances: {
      sql: `${CUBE}.instance_id = ${AppInstances}.id`,
      relationship: `many_to_one`,
    },
    Applications: {
      sql: `${CUBE}.app_id = ${Applications}.id`,
      relationship: `many_to_one`,
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [instanceId, snapshotDate, instanceStatus],
    },
    approvedInstancesCount: {
      type: `count`,
      filters: [{sql: `${CUBE}.instance_status = 'APPROVED'`}],
      drillMembers: [snapshotDate, instanceId, AppInstances.appName],
    },
    needsReviewInstancesCount: {
      type: `count`,
      filters: [{sql: `${CUBE}.instance_status = 'NEEDS_REVIEW'`}],
      drillMembers: [snapshotDate, instanceId, AppInstances.appName],
    },
    discoveredInstancesCount: {
      type: `count`,
      filters: [{sql: `${CUBE}.instance_status = 'DISCOVERED'`}],
      drillMembers: [snapshotDate, instanceId, AppInstances.appName],
    },
    deprecatedInstancesCount: {
      type: `count`,
      filters: [{sql: `${CUBE}.instance_status = 'DEPRECATED'`}],
      drillMembers: [snapshotDate, instanceId, AppInstances.appName],
    },
    blockedInstancesCount: {
      type: `count`,
      filters: [{sql: `${CUBE}.instance_status = 'BLOCKLISTED'`}],
      drillMembers: [snapshotDate, instanceId, AppInstances.appName],
    },
    approvedRatio: {
      type: `number`,
      sql: `CAST(${approvedInstancesCount} AS FLOAT) / NULLIF(${count}, 0)`,
      format: `percent`,
    },
    needsReviewRatio: {
      type: `number`,
      sql: `CAST(${needsReviewInstancesCount} AS FLOAT) / NULLIF(${count}, 0)`,
      format: `percent`,
    },
  },

  dimensions: {
    instanceId: {
      sql: `instance_id`,
      type: `number`,
      primaryKey: true,
      shown: true,
    },
    appId: {
      sql: `app_id`,
      type: `number`,
      shown: false,
    },
    snapshotDate: {
      sql: `snapshot_date`,
      type: `time`,
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
    isApproved: {
      sql: `${CUBE}.instance_status = 'APPROVED'`,
    },
    needsReview: {
      sql: `${CUBE}.instance_status = 'NEEDS_REVIEW'`,
    },
    isDiscovered: {
      sql: `${CUBE}.instance_status = 'DISCOVERED'`,
    },
    isDeprecated: {
      sql: `${CUBE}.instance_status = 'DEPRECATED'`,
    },
    isBlocklisted: {
      sql: `${CUBE}.instance_status = 'BLOCKLISTED'`,
    },
    recentlyDiscovered: {
      sql: `${CUBE}.instance_status = 'DISCOVERED' AND date(${CUBE}.snapshot_date) > date('now', '-30 days')`,
    },
  },
});
