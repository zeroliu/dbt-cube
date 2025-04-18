cube('DomainApplications', {
  sqlTable: `dim_domain_applications`, // Direct table name instead of DBT ref

  joins: {
    Applications: {
      sql: `${CUBE}.app_id = ${Applications}.app_id`,
      relationship: `belongsTo`,
    },
    // Join to Vendors if vendor info is added to dim_domain_applications or via Contracts
    // Vendors: { ... }
  },

  measures: {
    count: {
      type: `count`,
      description: `Total number of managed application instances in the domain.`,
    },
    potentialShadowItCount: {
      type: `count`,
      filters: [{sql: `${CUBE}.is_potential_shadow_it = TRUE`}],
      title: `Potential Shadow IT App Instances`,
    },
    explicitShadowItCount: {
      type: `count`,
      filters: [{sql: `${CUBE}.is_explicit_shadow_it = TRUE`}],
      title: `Explicit Shadow IT App Instances`,
    },
    lowUsageAppCount: {
      type: `count`,
      filters: [{sql: `${CUBE}.is_low_usage = TRUE`}], // Assumes is_low_usage flag from DBT
      title: `Low Usage App Instances`,
    },
    // Measures for users directly associated with the domain app
    totalUsersInDomain: {
      sql: `num_users_in_domain`, // From source table if kept
      type: `sum`, // Or use Accounts.userCount if preferred grain is account
      title: 'Total Users (All Sources)',
    },
    activeAccountsCount: {
      sql: `num_users_with_active_status`, // From source table if kept
      type: `sum`, // Or use Accounts.activeAccountCount
      title: 'Active Accounts',
    },
  },

  dimensions: {
    domainAppId: {
      sql: `domain_app_id`,
      type: `number`,
      primaryKey: true,
      title: `Domain App ID`,
    },
    domainId: {
      sql: `domain_id`,
      type: `number`,
      shown: false, // Hide unless multi-tenant
    },
    appId: {
      // Foreign key
      sql: `app_id`,
      type: `string`,
      shown: false,
    },
    appName: {
      // Convenience dimension from join
      sql: `${Applications.appName}`,
      type: `string`,
      title: `App Name`,
    },
    appCategory: {
      // Convenience dimension from join
      sql: `${Applications.appCategory}`, // Uses the base category
      type: `string`,
      title: `Base Category`,
    },
    finalCategory: {
      // Category including overrides
      sql: `final_category`, // This should be calculated in DBT
      type: `string`,
      title: `Final Category`,
    },
    instanceLabel: {
      sql: `instance_label`, // Renamed from app_instance_user_friendly_label in DBT
      type: `string`,
      title: `Instance Label`,
    },
    domainAppStatus: {
      sql: `domain_app_status`,
      type: `string`,
      title: `App Status`,
    },
    appConfiguration: {
      sql: `app_configuration`,
      type: `string`,
      title: `App Configuration`,
    },
    isPotentialShadowIt: {
      sql: `is_potential_shadow_it`,
      type: `boolean`,
      title: `Is Potential Shadow IT?`,
    },
    isExplicitShadowIt: {
      sql: `is_explicit_shadow_it`,
      type: `boolean`,
      title: `Is Explicit Shadow IT?`,
    },
    isLowUsage: {
      sql: `is_low_usage`, // Pre-calculated in DBT
      type: `boolean`,
      title: `Is Low Usage?`,
    },
    discoverySources: {
      sql: `discovery_sources`,
      type: `string`,
      title: `Discovery Sources`,
    },
    discoveredAt: {
      sql: `discovered_at`,
      type: `time`,
      title: `Discovered Date`,
    },
  },

  segments: {
    potentialShadowIt: {
      sql: `${CUBE}.is_potential_shadow_it = TRUE`,
    },
    explicitShadowIt: {
      sql: `${CUBE}.is_explicit_shadow_it = TRUE`,
    },
    lowUsageApps: {
      sql: `${CUBE}.is_low_usage = TRUE`,
    },
    approvedApps: {
      sql: `${CUBE}.domain_app_status = 'APPROVED'`,
    },
    needsReviewApps: {
      sql: `${CUBE}.domain_app_status = 'NEEDS_REVIEW'`,
    },
    discoveredApps: {
      sql: `${CUBE}.domain_app_status = 'DISCOVERED'`,
    },
    deprecatedOrBlocklisted: {
      sql: `${CUBE}.domain_app_status IN ('DEPRECATED', 'BLOCKLISTED')`,
    },
  },
});
