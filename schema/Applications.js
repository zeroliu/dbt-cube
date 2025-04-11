cube('Applications', {
  sql_table: `dim_applications`,

  description: 'Represents the portfolio of software applications.',

  measures: {
    count: {
      type: `count`,
      description: 'Total number of applications.',
    },

    // Measure for high-risk shadow IT apps
    highRiskShadowITCount: {
      type: 'count',
      description: 'Number of high-risk Shadow IT applications detected.',
      filters: [
        {sql: `${CUBE}.is_shadow_it = TRUE`},
        {sql: `${CUBE}.risk_score >= 8`}, // Use risk_score directly instead of non-existent risk_level
      ],
    },

    // Measure for potentially redundant apps identified
    redundantAppCount: {
      type: 'count',
      description: 'Number of applications flagged as redundant.',
      filters: [{sql: `${CUBE}.is_redundant_flag = TRUE`}],
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
    },
    name: {
      sql: `app_name`,
      type: `string`,
      description: 'Name of the application.',
    },
    vendor: {
      sql: `vendor_name`,
      type: `string`,
    },
    category: {
      sql: `functional_category`,
      type: `string`,
      description:
        'Standardized functional category (e.g., CRM, Collaboration).',
    },
    isRedundantFlag: {
      sql: `is_redundant_flag`, // Boolean flag indicating redundancy
      type: `boolean`,
    },
    consolidationGroupId: {
      sql: `consolidation_group_id`, // Identifier linking redundant apps
      type: `string`,
    },
    consolidationStatus: {
      sql: `consolidation_status`, // e.g., Identified, Reviewing, Completed
      type: `string`,
    },
    targetStandardAppId: {
      sql: `target_standard_app_id`, // ID of the app to consolidate onto
      type: `string`,
      shown: false,
    },
    riskScore: {
      sql: `risk_score`, // Numerical risk score (e.g., 1-10)
      type: `number`,
    },
    riskLevel: {
      // Derived risk level
      type: `string`,
      case: {
        when: [
          {sql: `${CUBE}.risk_score >= 8`, label: `High`}, // Example threshold
          {
            sql: `${CUBE}.risk_score >= 5 AND ${CUBE}.risk_score < 8`,
            label: `Medium`,
          },
        ],
        else: {label: `Low`},
      },
      description: 'Categorical risk level based on score.',
    },
    isShadowIT: {
      sql: `is_shadow_it`, // Boolean flag for discovered Shadow IT
      type: `boolean`,
    },

    // Foreign key for department join
    primaryDepartmentId: {
      sql: `primary_department_id`,
      type: `string`,
      shown: false,
    },
  },

  joins: {
    Departments: {
      relationship: `belongsTo`,
      sql: `${CUBE}.primary_department_id = ${Departments}.id`,
    },
  },
});
