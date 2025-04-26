cube('AppSources', {
  sqlTable: `dim_app_sources`,
  shown: false,

  joins: {
    AppInstances: {
      sql: `${CUBE}.app_instance_id = ${AppInstances}.id`,
      relationship: `many_to_one`,
    },
  },

  measures: {
    count: {
      type: `count`,
      description: `Total number of app sources.`,
    },
  },

  dimensions: {
    appSourceId: {
      sql: `app_source_id`,
      type: `string`,
      primaryKey: true,
      title: `App Source ID`,
    },
    appSourceName: {
      sql: `app_source_name`,
      type: `string`,
      title: `App Source Name`,
    },
    appInstanceId: {
      sql: `app_instance_id`,
      type: `string`,
      title: `App Instance ID`,
    },
  },
});
