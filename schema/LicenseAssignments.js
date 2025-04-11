cube('LicenseAssignments', {
  // Assumes this table has user_id, app_id, assignment_date, license_tier,
  // annual_cost_per_license, and the crucial pre-calculated last_activity_timestamp
  sql_table: `fact_license_assignments`,

  description:
    'Represents assigned software licenses linking users to applications.',

  measures: {
    assignedLicenseCount: {
      type: `count`,
      description: 'Total number of license assignments.',
    },

    // --- Inactivity Measures (Using pre-calculated timestamp) ---
    inactiveLicensedUsers: {
      description:
        'Counts distinct users with an assigned license whose last recorded activity timestamp falls outside the 90-day activity period.',
      type: 'countDistinct',
      sql: 'user_id',
      filters: [
        {
          sql: `${CUBE}.last_activity_timestamp IS NULL OR ${CUBE}.last_activity_timestamp < date(CURRENT_DATE, '-90 days')`,
        },
      ],
    },

    // --- Activity Measures (Using pre-calculated timestamp) ---
    activeLicensedUsers: {
      description:
        'Number of unique licensed users who were active during the last 90 days.',
      type: 'countDistinct',
      sql: 'user_id',
      filters: [
        {sql: `${CUBE}.last_activity_timestamp IS NOT NULL`},
        {
          sql: `${CUBE}.last_activity_timestamp >= date(CURRENT_DATE, '-90 days')`,
        },
      ],
    },

    // --- Total Distinct Users (Denominator for Rate) ---
    distinctLicensedUsers: {
      description:
        'Total number of unique users with at least one license assigned (matching filters).',
      type: 'countDistinct',
      sql: 'user_id',
    },

    // --- Utilization Rate KPI ---
    licenseUtilizationRate: {
      description:
        'Percentage of unique licensed users who were active during the last 90 days.',
      sql: `CAST(${activeLicensedUsers} AS REAL) / NULLIF(${distinctLicensedUsers}, 0)`,
      type: 'number',
      format: 'percent',
    },

    // --- Estimated Wasted Spend ---
    estimatedWastedSpend: {
      description:
        'Estimated annual cost of licenses assigned to inactive users (based on per-license cost).',
      type: 'sum',
      // Sum the cost only for inactive licenses
      sql: `CASE WHEN (${CUBE}.last_activity_timestamp IS NULL OR ${CUBE}.last_activity_timestamp < date(CURRENT_DATE, '-90 days')) THEN ${CUBE}.annual_cost_per_license ELSE 0 END`,
      format: 'currency',
    },
  },

  dimensions: {
    id: {
      sql: 'assignment_id',
      type: 'string',
      primaryKey: true,
      shown: false,
    },
    assignmentDate: {
      sql: `assignment_date`,
      type: `time`,
    },
    licenseType: {
      sql: `license_tier`, // e.g., Pro, Viewer, Standard
      type: `string`,
    },
    annualCostPerLicense: {
      sql: `annual_cost_per_license`,
      type: `number`,
      format: `currency`,
      description:
        'Annual cost associated with this specific license assignment.',
    },
    lastActivityTimestamp: {
      // The CRUCIAL pre-calculated dimension
      sql: `last_activity_timestamp`,
      type: `time`,
      description:
        'Pre-calculated timestamp of the last known activity for this assignment.',
    },
    // Foreign keys
    userId: {
      sql: `user_id`,
      type: `string`,
      shown: false,
    },
    appId: {
      sql: `app_id`,
      type: `string`,
      shown: false,
    },
  },

  joins: {
    Users: {
      relationship: `belongsTo`,
      sql: `${CUBE}.user_id = ${Users}.user_id`,
    },
    Applications: {
      relationship: `belongsTo`,
      sql: `${CUBE}.app_id = ${Applications}.id`,
    },
  },
});
