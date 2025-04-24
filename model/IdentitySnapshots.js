cube('IdentitySnapshots', {
  sqlTable: `fact_identity_snapshots`,
  title: 'Identities',
  joins: {
    Identities: {
      sql: `${CUBE}.identity_id = ${Identities}.id`,
      relationship: `many_to_one`,
    },
  },

  measures: {
    count: {
      type: `count`,
      drillMembers: [identityId, identityStatus],
    },
    currentCount: {
      type: `count`,
      filters: [
        {
          sql: `${CUBE}.is_current = 1`,
        },
      ],
    },
    lastWeekCount: {
      type: `count`,
      filters: [
        {
          sql: `(${CUBE}.effective_from <= date('now', '-7 days') AND (${CUBE}.effective_to > date('now', '-7 days') OR ${CUBE}.effective_to IS NULL))`,
        },
      ],
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
      primaryKey: true,
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
    currentRecords: {
      sql: `${CUBE}.is_current = 1`,
    },
  },
});
