import sqlite3
import pandas as pd
from faker import Faker
from datetime import datetime, timedelta
import random

fake = Faker()

# Create connection to SQLite database
conn = sqlite3.connect('raw_data.db')

# Generate customers data
def generate_customers(n=100):
    customers = []
    for _ in range(n):
        customers.append({
            'customer_id': fake.uuid4(),
            'name': fake.name(),
            'email': fake.email(),
            'country': fake.country(),
            'created_at': fake.date_time_between(start_date='-2y', end_date='now').isoformat()
        })
    return pd.DataFrame(customers)

# Generate products data
def generate_products(n=50):
    products = []
    categories = ['Electronics', 'Clothing', 'Books', 'Home & Garden', 'Sports']
    for _ in range(n):
        products.append({
            'product_id': fake.uuid4(),
            'name': fake.catch_phrase(),
            'category': random.choice(categories),
            'price': round(random.uniform(10, 1000), 2),
            'created_at': fake.date_time_between(start_date='-2y', end_date='now').isoformat()
        })
    return pd.DataFrame(products)

# Generate orders data
def generate_orders(customers_df, products_df, n=1000):
    orders = []
    for _ in range(n):
        customer = random.choice(customers_df['customer_id'].tolist())
        product = random.choice(products_df['product_id'].tolist())
        order_date = fake.date_time_between(start_date='-1y', end_date='now')

        orders.append({
            'order_id': fake.uuid4(),
            'customer_id': customer,
            'product_id': product,
            'quantity': random.randint(1, 5),
            'order_date': order_date.isoformat(),
            'status': random.choice(['completed', 'shipped', 'pending', 'cancelled'])
        })
    return pd.DataFrame(orders)

if __name__ == '__main__':
    # Generate data
    customers_df = generate_customers()
    products_df = generate_products()
    orders_df = generate_orders(customers_df, products_df)

    # Save to SQLite
    customers_df.to_sql('raw_customers', conn, if_exists='replace', index=False)
    products_df.to_sql('raw_products', conn, if_exists='replace', index=False)
    orders_df.to_sql('raw_orders', conn, if_exists='replace', index=False)

    print("Sample data generated successfully!")
    conn.close()
