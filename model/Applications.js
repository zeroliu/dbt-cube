cube('Applications', {
  sqlTable: `dim_applications`,

  measures: {
    count: {
      type: `count`,
      description: `Total number of base applications.`,
    },
  },

  dimensions: {
    appId: {
      sql: `app_id`,
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
