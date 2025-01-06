cube(`Customers`, {
  sql: `SELECT * FROM main.dim_customers`,

  measures: {
    count: {
      type: `count`,
    },
  },

  dimensions: {
    id: {
      sql: `customer_id`,
      type: `string`,
      primaryKey: true,
    },

    name: {
      sql: `name`,
      type: `string`,
    },

    email: {
      sql: `email`,
      type: `string`,
    },

    country: {
      sql: `country`,
      type: `string`,
    },

    createdAt: {
      sql: `created_at`,
      type: `time`,
    },
  },
});
