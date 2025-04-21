cube('AccountLicenses', {
  sqlTable: `fct_account_licenses`,

  joins: {
    Accounts: {
      sql: `${CUBE}.account_id = ${Accounts}.account_id`,
      relationship: `belongsTo`,
    },
    ContractLicenses: {
      sql: `${CUBE}.line_item_id = ${ContractLicenses}.line_item_id`,
      relationship: `belongsTo`,
    },
  },

  measures: {
    count: {
      type: `count`,
      description: `Total number of account-license assignments.`,
      drillMembers: [
        assignmentId,
        Accounts.accountId,
        ContractLicenses.lineItemId,
      ],
    },
    activeAssignmentsCount: {
      type: `count`,
      filters: [{sql: `${CUBE}.assignment_status = 'ASSIGNED'`}],
      title: `Active License Assignments`,
    },
    pendingAssignmentsCount: {
      type: `count`,
      filters: [{sql: `${CUBE}.assignment_status = 'PENDING'`}],
      title: `Pending License Assignments`,
    },
    revokedAssignmentsCount: {
      type: `count`,
      filters: [{sql: `${CUBE}.assignment_status = 'REVOKED'`}],
      title: `Revoked License Assignments`,
    },
    primaryLicensesCount: {
      type: `count`,
      filters: [{sql: `${CUBE}.is_primary_license = TRUE`}],
      title: `Primary License Assignments`,
    },
    secondaryLicensesCount: {
      type: `count`,
      filters: [{sql: `${CUBE}.is_primary_license = FALSE`}],
      title: `Secondary License Assignments`,
    },
    usersWithMultipleLicensesCount: {
      type: `countDistinct`,
      sql: `${Users.userId}`,
      filters: [
        {
          sql: `${CUBE}.account_id IN (
          SELECT account_id FROM fct_account_licenses
          GROUP BY account_id HAVING COUNT(*) > 1
        )`,
        },
      ],
      title: `Users With Multiple Licenses`,
    },
  },

  dimensions: {
    assignmentId: {
      sql: `assignment_id`,
      type: `number`,
      primaryKey: true,
    },
    accountId: {
      sql: `account_id`,
      type: `number`,
      shown: false,
    },
    lineItemId: {
      sql: `line_item_id`,
      type: `number`,
      shown: false,
    },
    assignmentStatus: {
      sql: `assignment_status`,
      type: `string`,
      title: `Assignment Status`,
    },
    assignedDate: {
      sql: `assigned_date`,
      type: `time`,
      title: `Assigned Date`,
    },
    endDate: {
      sql: `end_date`,
      type: `time`,
      title: `End Date`,
    },
    isPrimaryLicense: {
      sql: `is_primary_license`,
      type: `boolean`,
      title: `Is Primary License`,
    },
  },

  segments: {
    activeAssignments: {
      sql: `${CUBE}.assignment_status = 'ASSIGNED'`,
    },
    pendingAssignments: {
      sql: `${CUBE}.assignment_status = 'PENDING'`,
    },
    revokedAssignments: {
      sql: `${CUBE}.assignment_status = 'REVOKED'`,
    },
    primaryLicenses: {
      sql: `${CUBE}.is_primary_license = TRUE`,
    },
    secondaryLicenses: {
      sql: `${CUBE}.is_primary_license = FALSE`,
    },
  },

  // preAggregations: {
  //   // Rollup account licenses by user team and license type
  //   licenseAssignmentsByTeam: {
  //     type: `rollupJoin`,
  //     measureReferences: [AccountLicenses.count, AccountLicenses.activeAssignmentsCount],
  //     dimensionReferences: [Users.team, ContractLicenses.licenseType],
  //     segmentReferences: [AccountLicenses.activeAssignments],
  //     granularity: `month`,
  //     timeDimensionReference: AccountLicenses.assignedDate,
  //   },
  // },
});
