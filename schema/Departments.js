cube('Departments', {
  sql_table: `dim_departments`,

  description: 'Represents business departments or cost centers.',

  measures: {
    count: {
      type: `count`,
      description: 'Total number of departments.',
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `string`,
      primaryKey: true,
    },
    name: {
      sql: `department_name`,
      type: `string`,
    },
    costCenter: {
      sql: `cost_center_code`,
      type: `string`,
    },
  },
});
