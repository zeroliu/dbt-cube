cube('Vendors', {
  sqlTable: `dim_vendors`, // Direct table name instead of DBT ref

  measures: {
    count: {
      type: `count`,
      description: `Total number of vendors.`,
    },
  },
  dimensions: {
    vendorId: {sql: `vendor_id`, type: `number`, primaryKey: true},
    vendorName: {sql: `vendor_name`, type: `string`, title: 'Vendor Name'},
    // Add app_id if you link vendors directly to a primary app in the dim table
  },
});
