cube('IdentitySnapshots', {
  sqlTable: `fact_identity_snapshots`,

  joins: {
    Identities: {
      sql: `${CUBE}.identity_id = ${Identities}.id`,
      relationship: `many_to_one`,
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [identityId, snapshotDate, identityStatus],
    },
    activeIdentitiesCount: {
      type: `count`,
      filters: [{sql: `${CUBE}.identity_status = 'ACTIVE'`}],
      drillMembers: [snapshotDate, identityId],
    },
    terminatedIdentitiesCount: {
      type: `count`,
      filters: [{sql: `${CUBE}.identity_status = 'TERMINATED'`}],
      drillMembers: [snapshotDate, identityId],
    },
    onLeaveIdentitiesCount: {
      type: `count`,
      filters: [{sql: `${CUBE}.identity_status = 'ON_LEAVE'`}],
      drillMembers: [snapshotDate, identityId],
    },
    activeRatio: {
      type: `number`,
      sql: `CAST(${activeIdentitiesCount} AS FLOAT) / NULLIF(${count}, 0)`,
      format: `percent`,
    },
  },

  dimensions: {
    identityId: {
      sql: `identity_id`,
      type: `number`,
      primaryKey: true,
      shown: true,
    },
    snapshotDate: {
      sql: `snapshot_date`,
      type: `time`,
    },
    identityStatus: {
      sql: `identity_status`,
      type: `string`,
      title: `Identity Status`,
    },
    createdDate: {
      sql: `created_dt`,
      type: `time`,
      title: `Created Date`,
    },
  },

  segments: {
    isActive: {
      sql: `${CUBE}.identity_status = 'ACTIVE'`,
    },
    isTerminated: {
      sql: `${CUBE}.identity_status = 'TERMINATED'`,
    },
    isOnLeave: {
      sql: `${CUBE}.identity_status = 'ON_LEAVE'`,
    },
    recentlyTerminated: {
      sql: `${CUBE}.identity_status = 'TERMINATED' AND date(${CUBE}.snapshot_date) > date('now', '-30 days')`,
    },
  },
});
