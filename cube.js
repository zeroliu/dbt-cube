// Cube.js configuration options
module.exports = {
  // Enable query result caching
  sqlCache: true,
  // Define the data schema path (model is the new default in Cube.js 1.3.5)
  schemaPath: 'model',
  // Disable telemetry
  telemetry: false,
  // Set options for pre-aggregations
  orchestratorOptions: {
    queryCacheOptions: {
      refreshKeyRenewalThreshold: 2000,
    },
    rollupOnlyMode: false,
  },
};
