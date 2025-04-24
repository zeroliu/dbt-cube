cube('DateDimension', {
  sqlTable: 'dim_dates',
  shown: false,
  joins: {
    AccountSnapshots: {
      sql: `${CUBE}.full_date >= ${AccountSnapshots}.effective_from AND (${CUBE}.full_date < ${AccountSnapshots}.effective_to OR ${AccountSnapshots}.effective_to IS NULL)`,
      relationship: `one_to_many`,
    },
    AppInstanceSnapshots: {
      sql: `${CUBE}.full_date >= ${AppInstanceSnapshots}.effective_from AND (${CUBE}.full_date < ${AppInstanceSnapshots}.effective_to OR ${AppInstanceSnapshots}.effective_to IS NULL)`,
      relationship: `one_to_many`,
    },
    IdentitySnapshots: {
      sql: `${CUBE}.full_date >= ${IdentitySnapshots}.effective_from AND (${CUBE}.full_date < ${IdentitySnapshots}.effective_to OR ${IdentitySnapshots}.effective_to IS NULL)`,
      relationship: `one_to_many`,
    },
  },
  measures: {
    accountCount: {
      description: `Number of accounts at this date`,
      type: `countDistinct`,
      sql: `${AccountSnapshots.accountId}`,
    },
    appInstanceCount: {
      description: `Number of app instances at this date`,
      type: `countDistinct`,
      sql: `${AppInstanceSnapshots.instanceId}`,
    },
    identityCount: {
      description: `Number of identities at this date`,
      type: `countDistinct`,
      sql: `${IdentitySnapshots.identityId}`,
    },
    orphanedAccountsCount: {
      description: `Number of orphaned accounts at this date`,
      type: `countDistinct`,
      sql: `${AccountSnapshots.accountId}`,
      filters: [
        {sql: `${IdentitySnapshots.identityStatus} = 'TERMINATED'`},
        {sql: `${AccountSnapshots.userId} = ${IdentitySnapshots.identityId}`},
      ],
    },
  },
  dimensions: {
    date: {
      sql: `full_date`,
      type: `time`,
      primaryKey: true,
    },
  },
});
