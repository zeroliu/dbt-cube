# E-commerce Analytics with dbt and Cube.js

This is a sample project demonstrating the integration of dbt and Cube.js for analytics using SQLite as the database.

## Project Structure

- `generate_data.py`: Script to generate sample e-commerce data
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

### Raw Tables

- `raw_customers`: Customer information
- `raw_products`: Product catalog
- `raw_orders`: Order transactions

### dbt Models

- Staging models: Clean and standardize raw data
- Mart models: Create fact and dimension tables

### Cube.js Schema

- `Orders`: Order analysis with customer and product relationships
- `Customers`: Customer demographics and metrics
- `Products`: Product catalog and pricing analysis

## Example Queries

You can use the Cube.js Playground to explore the data. Here are some example queries:

1. Total sales by month
2. Top customers by order value
3. Product category performance
4. Order status distribution

## Development

1. Add new dbt models in the `models/` directory
2. Update Cube.js schema in the `schema/` directory
3. Run `dbt run` to update the transformed data
4. Restart Cube.js server to apply schema changes
