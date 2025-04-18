cube('ContractLicenses', {
  sqlTable: `fct_contract_licenses`, // Direct table name instead of DBT ref

  joins: {
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
    totalLicenseCost: {
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
      // Changed to use the difference between purchased and used quantity
      sql: `(${totalPurchasedQuantity} - ${totalUsedQuantity})`,
      title: 'License Surplus / Deficit',
    },
    totalUsedQuantity: {
      sql: `used_quantity`,
      type: `sum`,
      title: 'Total Used Licenses',
    },
    // *** Utilization Rate ***
    utilizationRate: {
      type: `number`,
      sql: `CASE WHEN ${totalPurchasedQuantity} > 0 THEN (${totalUsedQuantity} * 100.0 / ${totalPurchasedQuantity}) ELSE 0 END`,
      format: 'percent',
      title: 'License Utilization Rate',
    },
    // *** Unused License Cost ***
    unusedLicenseCost: {
      type: `number`,
      sql: `CASE
              WHEN ${licenseSurplus} > 0 AND ${totalPurchasedQuantity} > 0
              THEN ${licenseSurplus} * ${totalLicenseCost} / ${totalPurchasedQuantity}
              ELSE 0
            END`,
      format: `currency`,
      title: 'Unused License Cost',
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
    purchasedQuantity: {
      sql: `purchased_quantity`,
      type: `number`,
      title: 'Purchased Quantity',
    },
    usedQuantity: {
      sql: `used_quantity`,
      type: `number`,
      title: 'Used Quantity',
    },
  },

  segments: {
    seatLicenses: {
      sql: `${CUBE}.license_type = 'SEAT_LICENSE'`,
    },
    underutilizedLicenses: {
      sql: `${CUBE}.used_quantity < ${CUBE}.purchased_quantity * 0.7`, // Under 70% utilization
    },
    overutilizedLicenses: {
      sql: `${CUBE}.used_quantity > ${CUBE}.purchased_quantity`, // Using more licenses than purchased
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
