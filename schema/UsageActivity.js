cube('UsageActivity', {
  sql_table: `fact_usage_activity`,

  description:
    'Represents individual user activity events (e.g., logins). Performance critical.',

  measures: {
    activityCount: {
      type: `count`,
      description: 'Total number of activity events recorded.',
    },
    activeUsers: {
      sql: `user_id`,
      type: `countDistinct`,
      description: 'Number of unique users performing activities.',
    },
    activeApps: {
      sql: `app_id`,
      type: `countDistinct`,
      description: 'Number of unique applications with recorded activity.',
    },
  },

  dimensions: {
    id: {
      sql: `event_id`,
      type: `string`,
      primaryKey: true,
      shown: false,
    },
    // This is the primary dimension users will filter on for time context
    activityTimestamp: {
      sql: `activity_ts`,
      type: `time`,
      description: 'Timestamp when the activity event occurred.',
    },
    activityType: {
      sql: `activity_type`, // e.g., Login, FeatureUse
      type: `string`,
      description: 'Category or type of the user activity.',
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
      sql: `${CUBE}.user_id = ${Users}.id`,
    },
    Applications: {
      relationship: `belongsTo`,
      sql: `${CUBE}.app_id = ${Applications}.id`,
    },
  },

  // --- PRE-AGGREGATIONS ARE HIGHLY RECOMMENDED HERE ---
  // preAggregations: {
  //   // Example: Daily rollup for active users per app
  //   dailyActiveUsersPerApp: {
  //     type: `rollup`,
  //     measureReferences: [activeUsers, activityCount], // Active users is often the key one
  //     dimensionReferences: [appId], // Roll up per application
  //     timeDimensionReference: activityTimestamp,
  //     granularity: `day`,
  //     // Add refresh key, indexes, etc. as needed
  //     // refreshKey: { every: `1 hour` }
  //   },
  //   // Add more pre-aggregations as needed for common query patterns
  //   // E.g., monthly active users per department (requires joining Users first)
  // },
});
