cube('Users', {
  sql_table: `dim_users`,

  description: 'Represents employees or system users.',

  measures: {
    count: {
      type: `count`,
      description: 'Total number of users.',
    },
    activeHeadcount: {
      type: `count`,
      description: 'Number of currently active employees.',
      filters: [{sql: `${CUBE}.employment_status = 'Active'`}],
    },
  },

  dimensions: {
    id: {
      sql: `user_id`,
      type: `string`,
      primaryKey: true,
    },
    name: {
      sql: `user_name`,
      type: `string`,
    },
    email: {
      sql: `user_email`,
      type: `string`,
    },
    employmentStatus: {
      sql: `employment_status`, // e.g., Active, Terminated
      type: `string`,
    },
    // Foreign key for joining to Departments
    departmentId: {
      sql: `department_id`,
      type: `string`,
      shown: false,
    },
  },

  joins: {
    Departments: {
      relationship: `belongsTo`,
      sql: `${CUBE}.department_id = ${Departments}.id`,
    },
  },
});
