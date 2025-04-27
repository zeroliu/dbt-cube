cube('IdentitySnapshots', {
  shown: false,
  sql: `
    SELECT
      i.*,
      d.full_date as snapshot_date
    FROM dim_dates d
    JOIN dim_identity_snapshots i
      ON d.full_date >= i.effective_from
      AND d.full_date < i.effective_to
  `,
  title: 'Identity Snapshots',
  joins: {
    Identities: {
      sql: `${CUBE}.identity_id = ${Identities}.id`,
      relationship: `many_to_one`,
    },
    AccountSnapshots: {
      sql: `${CUBE}.identity_id = ${AccountSnapshots.userId} AND ${CUBE}.snapshot_date = ${AccountSnapshots.snapshotDate}`,
      relationship: `one_to_many`,
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [identityId, identityStatus],
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
      shown: true,
    },
    identityId: {
      sql: `identity_id`,
      type: `number`,
      shown: true,
    },
    email: {
      sql: `${Identities.email}`,
      type: `string`,
    },
    fullName: {
      sql: `${Identities.fullName}`,
      type: `string`,
      title: `Full Name`,
    },
    team: {
      sql: `${Identities.team}`,
      type: `string`,
    },
    startDate: {
      sql: `${Identities.startDate}`,
      type: `time`,
      title: `Start Date`,
    },
    endDate: {
      sql: `${Identities.endDate}`,
      type: `time`,
      title: `End Date`,
    },
    managerName: {
      sql: `${Identities.managerName}`,
      type: `string`,
      title: `Manager Name`,
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
    snapshotDate: {
      sql: `snapshot_date`,
      type: `time`,
      title: `Snapshot Date`,
    },
  },

  segments: {},
});
