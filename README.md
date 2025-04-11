# SaaS Management Analytics with dbt and Cube.js

This is a sample project demonstrating the integration of dbt and Cube.js for SaaS management analytics using SQLite as the database. It highlights the power of Cube.js for SaaS spend optimization and license management.

## Project Structure

- `generate_data.py`: Script to generate sample SaaS management data
- `dbt/`: Contains dbt models and configurations
- `schema/`: Contains Cube.js schema definitions
- `raw_data.db`: SQLite database with raw data

## Setup Instructions

1. Install Python dependencies:

```bash
pip install -r requirements.txt
```

2. Generate sample data:

```bash
python generate_data.py
```

3. Install dbt dependencies and run models:

```bash
dbt deps
dbt run
```

4. Install Node.js dependencies:

```bash
npm install
```

5. Start Cube.js development server:

```bash
npm run dev
```

## Data Model

The project includes:

### Dimension Tables

- `dim_departments`: Business departments/cost centers
- `dim_users`: Employee and system user information
- `dim_applications`: Software application portfolio

### Fact Tables

- `fact_license_assignments`: Software licenses assigned to users
- `fact_usage_activity`: User activity events for applications

### Cube.js Schema

- `Departments`: Department and cost center analysis
- `Users`: User demographics and metrics
- `Applications`: Application portfolio analysis
- `LicenseAssignments`: License utilization and cost analysis
- `UsageActivity`: User activity patterns and engagement

## Example Queries

You can use the Cube.js Playground to explore the data. Here are some example queries:

1. License utilization rate by application
2. Estimated wasted spend on inactive licenses
3. High-risk shadow IT applications
4. Redundant applications by category
5. Application usage trends by department

## Development

1. Add new dbt models in the `models/` directory
2. Update Cube.js schema in the `schema/` directory
3. Run `dbt run` to update the transformed data
4. Restart Cube.js server to apply schema changes
