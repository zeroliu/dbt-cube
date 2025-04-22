cube('Applications', {
  shown: false,
  sqlTable: `fact_applications`,

  joins: {
    AppInstances: {
      sql: `${CUBE}.id = ${AppInstances}.app_id`,
      relationship: `one_to_many`,
    },
  },

  measures: {
    count: {
      type: `count`,
      description: `Total number of base applications.`,
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
      title: `App ID`,
    },
    appName: {
      sql: `app_name`,
      type: `string`,
      title: `App Name`,
    },
    appCategory: {
      sql: `app_category`,
      type: `string`,
      title: `Category`,
    },
    appDescription: {
      sql: `app_description`,
      type: `string`,
      title: `Description`,
    },
  },
});
