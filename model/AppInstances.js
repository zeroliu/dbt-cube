cube('AppInstances', {
  sqlTable: `dim_domain_applications`, // Direct table name instead of DBT ref

  joins: {
    Accounts: {
      sql: `${CUBE}.id = ${Accounts}.app_instance_id`,
      relationship: `one_to_many`,
    },
    AppSources: {
      sql: `${CUBE}.id = ${AppSources}.app_instance_id`,
      relationship: `one_to_many`,
    },
    Applications: {
      sql: `${CUBE}.id = ${Applications}.id`,
      relationship: `many_to_one`,
    },
    Licenses: {
      sql: `${CUBE}.id = ${Licenses}.app_instance_id`,
      relationship: `one_to_many`,
    },
  },

  measures: {
    count: {
      type: `count`,
      description: `Total number of managed application instances in the domain.`,
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
      title: `Domain App ID`,
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
    label: {
      sql: `instance_label`, // Renamed from app_instance_user_friendly_label in DBT
      type: `string`,
      title: `App Instance Label`,
    },
    status: {
      sql: `domain_app_status`,
      type: `string`,
      title: `App Instance Status`,
    },
    isShadowIt: {
      sql: `is_shadow_it`,
      type: `boolean`,
      title: `Is Shadow IT?`,
    },
    isInAppStore: {
      sql: `is_in_app_store`,
      type: `boolean`,
      title: `Is In App Store?`,
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

  segments: {},
});
