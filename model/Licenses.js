cube('Licenses', {
  sqlTable: `fct_licenses`,
  shown: false,
  joins: {
    Accounts: {
      sql: `${CUBE}.account_id = ${Accounts}.id`,
      relationship: `many_to_one`,
    },
    AppInstances: {
      sql: `${CUBE}.app_instance_id = ${AppInstances}.id`,
      relationship: `many_to_one`,
    },
  },

  measures: {
    count: {
      type: `count`,
      description: `Total number of licenses.`,
      drillMembers: [id, Accounts.id],
    },
    totalAnnualCost: {
      sql: `unit_annual_cost`,
      type: `sum`,
      title: `Total Annual Cost`,
    },
  },

  dimensions: {
    id: {
      sql: `id`,
      type: `number`,
      primaryKey: true,
    },
    licenseName: {
      sql: `license_name`,
      type: `string`,
      title: `License Name`,
    },
    accountId: {
      sql: `account_id`,
      type: `number`,
      shown: false,
    },
    appInstanceId: {
      sql: `app_instance_id`,
      type: `number`,
      shown: false,
    },
    assignedDate: {
      sql: `assigned_date`,
      type: `time`,
      title: `Assigned Date`,
    },
    endDate: {
      sql: `end_date`,
      type: `time`,
      title: `End Date`,
    },
    unitAnnualCost: {
      sql: `unit_annual_cost`,
      type: `number`,
      title: `Unit Annual Cost`,
    },
    isPrivileged: {
      sql: `is_privileged`,
      type: `boolean`,
      title: `Is Privileged`,
    },
    purchasedQuantity: {
      sql: `purchased_quantity`,
      type: `number`,
      title: `Purchased Quantity`,
    },
    totalPurchasedAnnualCost: {
      sql: `purchased_quantity * unit_annual_cost`,
      type: `number`,
      title: `Total Purchased Annual Cost`,
    },
  },

  segments: {},
});
