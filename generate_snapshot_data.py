#!/usr/bin/env python3
import sqlite3
import datetime
import random
from typing import Optional, List

# Connect to SQLite database
conn = sqlite3.connect('raw_data.db')
c = conn.cursor()

# Create snapshot tables if they don't exist
print("Creating snapshot tables...")

# Create account snapshots table
c.execute('''
CREATE TABLE IF NOT EXISTS fact_account_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    app_instance_id INTEGER NOT NULL,
    account_status TEXT NOT NULL,
    last_activity_dt TEXT,
    snapshot_date TEXT NOT NULL,
    is_matched BOOLEAN,
    is_admin BOOLEAN,
    FOREIGN KEY (account_id) REFERENCES fct_accounts(id),
    FOREIGN KEY (app_instance_id) REFERENCES dim_domain_applications(id)
)
''')

# Create identity snapshots table
c.execute('''
CREATE TABLE IF NOT EXISTS fact_identity_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    identity_id INTEGER NOT NULL,
    identity_status TEXT NOT NULL,
    created_dt TEXT,
    snapshot_date TEXT NOT NULL,
    FOREIGN KEY (identity_id) REFERENCES dim_identities(id)
)
''')

# Create app instance snapshots table
c.execute('''
CREATE TABLE IF NOT EXISTS fact_app_instance_snapshots (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    instance_id INTEGER NOT NULL,
    app_id INTEGER NOT NULL,
    instance_status TEXT NOT NULL,
    created_dt TEXT,
    snapshot_date TEXT NOT NULL,
    FOREIGN KEY (instance_id) REFERENCES dim_domain_applications(id),
    FOREIGN KEY (app_id) REFERENCES fact_applications(id)
)
''')

# Clear existing data (optional - comment out if you want to keep existing snapshots)
c.execute("DELETE FROM fact_account_snapshots")
c.execute("DELETE FROM fact_app_instance_snapshots")

# Generate snapshot dates (last 1 month, daily snapshots)
today = datetime.datetime.now()
snapshot_dates: List[str] = []
for i in range(30):  # 1 month of daily snapshots
    snapshot_date = today - datetime.timedelta(days=i)
    snapshot_dates.append(snapshot_date.strftime('%Y-%m-%d'))

print(f"Generating snapshots for {len(snapshot_dates)} days...")

# Generate account snapshots
c.execute("SELECT id, user_id, app_instance_id, account_status, last_activity_dt, is_matched, is_admin FROM fct_accounts")
accounts = c.fetchall()

print(f"Processing {len(accounts)} accounts...")
account_count = 0

for account in accounts:
    account_id, user_id, app_instance_id, status, last_activity, is_matched, is_admin = account

    # Create snapshot entries for each date
    for snapshot_date_str in snapshot_dates:
        # Randomly vary the account status over time for some accounts
        if random.random() < 0.2:  # 20% chance of status change
            new_status = random.choice(['ACTIVE', 'SUSPENDED'])
        else:
            new_status = status

        # Update last_activity_dt for some accounts regardless of status
        # This simulates that activity can happen on any account regardless of status
        if random.random() < 0.3:  # 30% chance of activity update
            # Set last_activity_dt to a random date close to the snapshot
            days_before = random.randint(0, 7)
            snapshot_datetime = datetime.datetime.strptime(snapshot_date_str, '%Y-%m-%d')
            activity_date = snapshot_datetime - datetime.timedelta(days=days_before)
            new_last_activity = activity_date.strftime('%Y-%m-%d')
        else:
            new_last_activity = last_activity

        # Insert the snapshot record
        c.execute('''
            INSERT INTO fact_account_snapshots
            (account_id, app_instance_id, account_status, last_activity_dt, snapshot_date, is_matched, is_admin)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        ''', (account_id, app_instance_id, new_status, new_last_activity, snapshot_date_str, is_matched, is_admin))

    account_count += 1
    if account_count % 100 == 0:
        print(f"Processed {account_count} accounts...")

# Generate identity snapshots
c.execute("SELECT id, status, start_date FROM dim_identities")
identities = c.fetchall()

print(f"Processing {len(identities)} identities...")
identity_count = 0

for identity in identities:
    identity_id, status, created_dt = identity

    for snapshot_date_str in snapshot_dates:
        # Randomly vary the identity status for some identities
        if random.random() < 0.1:  # 10% chance of status change
            new_status = random.choice(['ACTIVE', 'TERMINATED', 'ON_LEAVE'])
        else:
            new_status = status

        # Insert the snapshot record
        c.execute('''
            INSERT INTO fact_identity_snapshots
            (identity_id, identity_status, created_dt, snapshot_date)
            VALUES (?, ?, ?, ?)
        ''', (identity_id, new_status, created_dt, snapshot_date_str))

    identity_count += 1
    if identity_count % 50 == 0:
        print(f"Processed {identity_count} identities...")

# Generate app instance snapshots
c.execute("SELECT id, app_id, domain_app_status, discovered_at FROM dim_domain_applications")
app_instances = c.fetchall()

print(f"Processing {len(app_instances)} app instances...")
instance_count = 0

for app_instance in app_instances:
    instance_id, app_id, status, created_dt = app_instance

    for snapshot_date_str in snapshot_dates:
        # Randomly vary the instance status for some instances
        if random.random() < 0.1:  # 10% chance of status change
            new_status = random.choice(['APPROVED', 'NEEDS_REVIEW', 'DISCOVERED', 'DEPRECATED', 'BLOCKLISTED'])
        else:
            new_status = status

        # Insert the snapshot record
        c.execute('''
            INSERT INTO fact_app_instance_snapshots
            (instance_id, app_id, instance_status, created_dt, snapshot_date)
            VALUES (?, ?, ?, ?, ?)
        ''', (instance_id, app_id, new_status, created_dt, snapshot_date_str))

    instance_count += 1
    if instance_count % 50 == 0:
        print(f"Processed {instance_count} app instances...")

# Commit and close
conn.commit()
conn.close()

print("Snapshot data generated successfully for accounts, identities, and app instances!")
