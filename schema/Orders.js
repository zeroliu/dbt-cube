cube(`Orders`, {
  sql: `SELECT * FROM main.fct_orders`,

  measures: {
    count: {
      type: `count`,
    },

    totalAmount: {
      sql: `total_amount`,
      type: `sum`,
    },

    averageOrderValue: {
      sql: `total_amount`,
      type: `avg`,
    },
  },

  dimensions: {
    id: {
      sql: `order_id`,
      type: `string`,
      primaryKey: true,
    },

    status: {
      sql: `status`,
      type: `string`,
    },

    orderDate: {
      sql: `order_date`,
      type: `time`,
    },
  },

  joins: {
    Customers: {
      sql: `${CUBE}.customer_id = ${Customers}.customer_id`,
      relationship: `belongsTo`,
    },

    Products: {
      sql: `${CUBE}.product_id = ${Products}.product_id`,
      relationship: `belongsTo`,
    },
  },
});
