cube(`Products`, {
  sql: `SELECT * FROM main.dim_products`,

  measures: {
    count: {
      type: `count`,
    },

    averagePrice: {
      sql: `price`,
      type: `avg`,
    },
  },

  dimensions: {
    id: {
      sql: `product_id`,
      type: `string`,
      primaryKey: true,
    },

    name: {
      sql: `name`,
      type: `string`,
    },

    category: {
      sql: `category`,
      type: `string`,
    },

    price: {
      sql: `price`,
      type: `number`,
    },

    createdAt: {
      sql: `created_at`,
      type: `time`,
    },
  },
});
