cube('ContractLicenses', {
  sqlTable: `fct_contract_licenses`, // Direct table name instead of DBT ref

  joins: {
    // Join to Contracts dimension if needed
    // Contracts: { ... }
    DomainApplications: {
      sql: `${CUBE}.domain_app_id = ${DomainApplications}.domain_app_id`,
      relationship: `belongsTo`,
    },
  },

  measures: {
    count: {type: 'count'}, // Count of license line items/orders
    totalPurchasedQuantity: {
      sql: `purchased_quantity`,
      type: `sum`,
      title: 'Total Purchased Licenses',
    },
    totalContractCost: {
      sql: `total_cost`, // Cost for the line item/order period
      type: `sum`,
      format: `currency`,
      title: 'Total Contract Cost (Period)',
    },
    estimatedCostPerLicenseAnnual: {
      sql: `cost_per_license_annual`, // Pre-calculated in DBT
      type: `avg`, // Changed from 'average' to 'avg'
      format: `currency`,
      title: `Avg Annual Cost Per License`,
    },
    // *** Calculated Measure for License Surplus ***
    licenseSurplus: {
      type: `number`,
      // This requires joining DomainApplications for its active user count.
      // It's often better calculated in DBT and stored in fct_contract_licenses.
      // If calculated here, it needs the join and careful aggregation.
      // Example (assuming DomainApplications is joined):
      sql: `${totalPurchasedQuantity} - ${DomainApplications.activeAccountsCount}`,
      title: 'License Surplus / Deficit',
    },
  },

  dimensions: {
    lineItemId: {sql: `line_item_id`, type: `number`, primaryKey: true},
    contractId: {sql: `contract_id`, type: `number`, shown: false}, // FK
    domainAppId: {sql: `domain_app_id`, type: `number`, shown: false}, // FK
    licenseType: {sql: `license_type`, type: `string`, title: `License Type`},
    payPeriod: {sql: `pay_period`, type: `string`, title: `Pay Period`},
    startDate: {sql: `start_date`, type: `time`},
    endDate: {sql: `end_date`, type: `time`},
  },

  segments: {
    seatLicenses: {
      sql: `${CUBE}.license_type = 'SEAT_LICENSE'`,
    },
  },

  // preAggregations: {
  //   // Pre-aggregate license surplus/cost by app
  //   licenseSummaryByApp: {
  //     type: `rollupJoin`, // Join with DomainApplications
  //     measureReferences: [
  //       totalPurchasedQuantity,
  //       totalContractCost,
  //       licenseSurplus,
  //       DomainApplications.activeAccountsCount,
  //     ],
  //     dimensionReferences: [
  //       DomainApplications.appName,
  //       DomainApplications.finalCategory,
  //     ],
  //     segmentReferences: [seatLicenses],
  //     granularity: `month`,
  //     timeDimensionReference: startDate, // Or maybe a contract snapshot date
  //   },
  // },
});
