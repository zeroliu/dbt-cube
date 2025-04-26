#!/usr/bin/env python3
import sqlite3
import datetime
import random
from typing import Optional, List, Dict, Any

# Connect to SQLite database
conn = sqlite3.connect('raw_data.db')
c = conn.cursor()

# Create snapshot tables if they don't exist
print("Creating SCD Type 2 tables...")

# Drop existing tables if they exist to recreate with new schema
c.execute("DROP TABLE IF EXISTS dim_account_snapshots")
c.execute("DROP TABLE IF EXISTS dim_identity_snapshots")
c.execute("DROP TABLE IF EXISTS dim_app_instance_snapshots")

# Create account snapshots table with SCD Type 2 fields
c.execute('''
CREATE TABLE IF NOT EXISTS dim_account_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    app_instance_id INTEGER NOT NULL,
    account_status TEXT NOT NULL,
    last_activity_dt TEXT,
    effective_from TEXT NOT NULL,
    effective_to TEXT,
    is_current BOOLEAN NOT NULL,
    is_matched BOOLEAN,
    is_admin BOOLEAN,
    FOREIGN KEY (account_id) REFERENCES dim_accounts(id),
    FOREIGN KEY (user_id) REFERENCES dim_identities(id),
    FOREIGN KEY (app_instance_id) REFERENCES dim_domain_applications(id)
)
''')

# Create identity snapshots table with SCD Type 2 fields
c.execute('''
CREATE TABLE IF NOT EXISTS dim_identity_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identity_id INTEGER NOT NULL,
    identity_status TEXT NOT NULL,
    created_dt TEXT,
    effective_from TEXT NOT NULL,
    effective_to TEXT,
    is_current BOOLEAN NOT NULL,
    FOREIGN KEY (identity_id) REFERENCES dim_identities(id)
)
''')

# Create app instance snapshots table with SCD Type 2 fields
c.execute('''
CREATE TABLE IF NOT EXISTS dim_app_instance_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instance_id INTEGER NOT NULL,
    app_id INTEGER NOT NULL,
    instance_status TEXT NOT NULL,
    created_dt TEXT,
    effective_from TEXT NOT NULL,
    effective_to TEXT,
    is_current BOOLEAN NOT NULL,
    is_shadow_it BOOLEAN NOT NULL,
    FOREIGN KEY (instance_id) REFERENCES dim_domain_applications(id),
    FOREIGN KEY (app_id) REFERENCES dim_applications(id)
)
''')

# Generate date range (last 1 month)
today = datetime.datetime.now()
end_date = today
start_date = today - datetime.timedelta(days=30)
start_date_str = start_date.strftime('%Y-%m-%d')
end_date_str = end_date.strftime('%Y-%m-%d')

print(f"Generating SCD Type 2 data from {end_date.strftime('%Y-%m-%d')} backward to {start_date.strftime('%Y-%m-%d')}...")

# 1. FIRST: Generate current records for all entities at end_date (today)

# Generate current account records
print("Creating current account records (today's state)...")
c.execute("SELECT id, user_id, app_instance_id, account_status, last_activity_dt, is_matched, is_admin FROM dim_accounts")
accounts = c.fetchall()

for account in accounts:
    account_id, user_id, app_instance_id, status, last_activity, is_matched, is_admin = account

    # Create current record at end_date
    record = {
        'account_id': account_id,
        'user_id': user_id,
        'app_instance_id': app_instance_id,
        'account_status': status,
        'last_activity_dt': last_activity,
        'effective_from': start_date_str,  # Set to one month ago
        'effective_to': '9999-12-31',
        'is_current': 1,
        'is_matched': is_matched,
        'is_admin': is_admin
    }

    columns = ', '.join(record.keys())
    placeholders = ', '.join(['?'] * len(record))
    c.execute(f"INSERT INTO dim_account_snapshots ({columns}) VALUES ({placeholders})",
             tuple(record.values()))

# Generate current identity records
print("Creating current identity records (today's state)...")
c.execute("SELECT id, status, start_date FROM dim_identities")
identities = c.fetchall()

for identity in identities:
    identity_id, status, created_dt = identity

    # Create current record at end_date
    record = {
        'identity_id': identity_id,
        'identity_status': status,
        'created_dt': created_dt,
        'effective_from': start_date_str,  # Set to one month ago
        'effective_to': '9999-12-31',
        'is_current': 1
    }

    columns = ', '.join(record.keys())
    placeholders = ', '.join(['?'] * len(record))
    c.execute(f"INSERT INTO dim_identity_snapshots ({columns}) VALUES ({placeholders})",
             tuple(record.values()))

# Generate current app instance records
print("Creating current app instance records (today's state)...")
c.execute("SELECT id, app_id, domain_app_status, discovered_at, is_shadow_it FROM dim_domain_applications")
app_instances = c.fetchall()

for app_instance in app_instances:
    instance_id, app_id, status, created_dt, is_shadow_it = app_instance

    # Create current record at end_date
    record = {
        'instance_id': instance_id,
        'app_id': app_id,
        'instance_status': status,
        'created_dt': created_dt,
        'effective_from': start_date_str,  # Set to one month ago
        'effective_to': '9999-12-31',
        'is_current': 1,
        'is_shadow_it': is_shadow_it
    }

    columns = ', '.join(record.keys())
    placeholders = ', '.join(['?'] * len(record))
    c.execute(f"INSERT INTO dim_app_instance_snapshots ({columns}) VALUES ({placeholders})",
             tuple(record.values()))

# Store the current state of each entity for backward changes
account_states = {}
for account in accounts:
    account_id, user_id, app_instance_id, status, last_activity, is_matched, is_admin = account
    account_states[account_id] = {
        'status': status,
        'user_id': user_id,
        'last_activity': last_activity,
        'is_matched': is_matched,
        'is_admin': is_admin
    }

identity_states = {}
for identity in identities:
    identity_id, status, created_dt = identity
    identity_states[identity_id] = {
        'status': status,
        'created_dt': created_dt
    }

app_instance_states = {}
for app_instance in app_instances:
    instance_id, app_id, status, created_dt, is_shadow_it = app_instance
    app_instance_states[instance_id] = {
        'status': status,
        'created_dt': created_dt,
        'is_shadow_it': is_shadow_it
    }

# Helper function to add historical SCD Type 2 record
def add_historical_record(table_name: str, entity_id: int, record: Dict[str, Any],
                         effective_date: str, entity_id_column: str):
    # When going backwards in time, we're creating records that are earlier
    # We need to check if this is the earliest record we've seen for this entity
    c.execute(f"SELECT id FROM {table_name} WHERE {entity_id_column} = ? AND effective_from = ?",
             (entity_id, start_date_str))
    last_record = c.fetchone()
    c.execute(f"UPDATE {table_name} SET effective_from = ? WHERE id = ?",
             (effective_date, last_record[0]))

    # Insert the new historical record
    columns = ', '.join(record.keys())
    placeholders = ', '.join(['?'] * len(record))
    c.execute(f"INSERT INTO {table_name} ({columns}) VALUES ({placeholders})",
             tuple(record.values()))

# 2. SECOND: Generate historical changes going backward in time
print("Generating historical changes backward in time...")

# Start from yesterday and go backward to start_date
current_date = end_date - datetime.timedelta(days=1)
days_back = 1

while current_date >= start_date:
    current_date_str = current_date.strftime('%Y-%m-%d')
    previous_date_str = (current_date + datetime.timedelta(days=1)).strftime('%Y-%m-%d')

    # Process account historical changes
    for account_id, current_state in account_states.items():
        # Get the app_instance_id for this account
        c.execute("SELECT app_instance_id FROM dim_accounts WHERE id = ?", (account_id,))
        app_instance_id = c.fetchone()[0]

        # Determine if there should be a change
        make_change = False
        historical_state = current_state.copy()

        # Randomly change status (20% chance)
        if random.random() < 0.2:
            historical_state['status'] = random.choice(['ACTIVE', 'SUSPENDED'])
            make_change = True

        # Randomly update last activity date (30% chance)
        if random.random() < 0.3:
            days_before = random.randint(0, 7)
            activity_date = current_date - datetime.timedelta(days=days_before)
            historical_state['last_activity'] = activity_date.strftime('%Y-%m-%d')
            make_change = True

        # Randomly change is_matched or is_admin (10% chance)
        if random.random() < 0.1:
            historical_state['is_matched'] = not current_state['is_matched']
            make_change = True

        if random.random() < 0.1:
            historical_state['is_admin'] = not current_state['is_admin']
            make_change = True

        # If there's a change, create a historical record
        if make_change:
            record = {
                'account_id': account_id,
                'user_id': current_state['user_id'],
                'app_instance_id': app_instance_id,
                'account_status': historical_state['status'],
                'last_activity_dt': historical_state['last_activity'],
                'effective_from': start_date_str,
                'effective_to': current_date_str,
                'is_current': 0,
                'is_matched': historical_state['is_matched'],
                'is_admin': historical_state['is_admin']
            }

            add_historical_record('dim_account_snapshots', account_id, record,
                                 current_date_str, 'account_id')

            # Update the current state (for the next iteration)
            account_states[account_id] = historical_state

    # Process identity historical changes
    for identity_id, current_state in identity_states.items():
        # Determine if there should be a change
        make_change = False
        historical_state = current_state.copy()

        # Randomly change status (10% chance)
        if random.random() < 0.1:
            historical_state['status'] = random.choice(['ACTIVE', 'TERMINATED', 'ON_LEAVE'])
            make_change = True

        # If there's a change, create a historical record
        if make_change:
            record = {
                'identity_id': identity_id,
                'identity_status': historical_state['status'],
                'created_dt': historical_state['created_dt'],
                'effective_from': start_date_str,  # Set to the current iteration date
                'effective_to': current_date_str,
                'is_current': 0
            }

            add_historical_record('dim_identity_snapshots', identity_id, record,
                                 current_date_str, 'identity_id')

            # Update the current state (for the next iteration)
            identity_states[identity_id] = historical_state

    # Process app instance historical changes
    for instance_id, current_state in app_instance_states.items():
        # Get the app_id for this instance
        c.execute("SELECT app_id FROM dim_domain_applications WHERE id = ?", (instance_id,))
        app_id = c.fetchone()[0]

        # Determine if there should be a change
        make_change = False
        historical_state = current_state.copy()

        # Randomly change status (10% chance)
        if random.random() < 0.1:
            historical_state['status'] = random.choice(['APPROVED', 'NEEDS_REVIEW', 'DISCOVERED', 'DEPRECATED', 'BLOCKLISTED'])
            make_change = True

        # Randomly change shadow IT status (5% chance)
        if random.random() < 0.05:
            historical_state['is_shadow_it'] = not current_state['is_shadow_it']
            make_change = True

        # If there's a change, create a historical record
        if make_change:
            record = {
                'instance_id': instance_id,
                'app_id': app_id,
                'instance_status': historical_state['status'],
                'created_dt': historical_state['created_dt'],
                'effective_from': start_date_str,
                'effective_to': current_date_str,
                'is_current': 0,
                'is_shadow_it': historical_state['is_shadow_it']
            }

            add_historical_record('dim_app_instance_snapshots', instance_id, record,
                                 current_date_str, 'instance_id')

            # Update the current state (for the next iteration)
            app_instance_states[instance_id] = historical_state

    days_back += 1
    if days_back % 5 == 0:
        print(f"Processed {days_back} days back in time...")

    current_date -= datetime.timedelta(days=1)

# Commit and close
conn.commit()
conn.close()

print("SCD Type 2 data generated successfully for accounts, identities, and app instances!")
print("The most recent state matches the current state in the original tables.")
