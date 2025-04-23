import sqlite3
import pandas as pd
from faker import Faker
from datetime import datetime, timedelta
import random
import uuid

fake = Faker()

# Create connection to SQLite database
conn = sqlite3.connect('raw_data.db')

# Generate departments data
def generate_departments(n=15):
    departments = []
    department_names = [
        'Finance', 'Human Resources', 'Marketing', 'Sales', 'Engineering',
        'Product', 'Customer Support', 'Operations', 'Legal', 'IT',
        'Research & Development', 'Administration', 'Business Development',
        'Quality Assurance', 'Executive'
    ]

    for i in range(min(n, len(department_names))):
        departments.append({
            'id': i + 1,
            'department_name': department_names[i],
            'cost_center_code': f"CC-{random.randint(1000, 9999)}"
        })
    return pd.DataFrame(departments)

# Generate identities data (renamed from users)
def generate_identities(departments_df, n=200):
    identities = []
    statuses = ['ACTIVE', 'TERMINATED', 'ON_LEAVE']
    status_weights = [0.85, 0.1, 0.05]  # 85% active
    teams = ['Frontend', 'Backend', 'DevOps', 'QA', 'UX', 'Sales', 'Marketing', 'Finance', 'HR']
    identity_types = ['EMPLOYEE', 'CONTRACTOR', 'VENDOR']
    identity_type_weights = [0.8, 0.15, 0.05]

    # First create some managers
    manager_ids = []
    for i in range(10):
        identity_id = i + 1
        manager_ids.append(identity_id)
        department = random.choice(departments_df['id'].tolist())
        start_date = fake.date_between(start_date='-5y', end_date='-1y')

        identities.append({
            'id': identity_id,
            'full_name_precomputed': fake.name(),
            'email': fake.email(),
            'team': random.choice(teams),
            'status': random.choices(statuses, weights=status_weights)[0],
            'department_id': department,
            'manager_id': None,  # Top-level managers have no manager
            'start_date': start_date,
            'end_date': None if random.random() < 0.95 else fake.date_between(start_date=start_date, end_date='today'),
            'identity_type': random.choices(identity_types, weights=identity_type_weights)[0]
        })

    # Then create the rest of the identities
    for i in range(10, n):
        identity_id = i + 1
        department = random.choice(departments_df['id'].tolist())
        manager_id = random.choice(manager_ids)
        start_date = fake.date_between(start_date='-3y', end_date='-1m')

        identities.append({
            'id': identity_id,
            'full_name_precomputed': fake.name(),
            'email': fake.email(),
            'team': random.choice(teams),
            'status': random.choices(statuses, weights=status_weights)[0],
            'department_id': department,
            'manager_id': manager_id,
            'start_date': start_date,
            'end_date': None if random.random() < 0.95 else fake.date_between(start_date=start_date, end_date='today'),
            'identity_type': random.choices(identity_types, weights=identity_type_weights)[0]
        })

    return pd.DataFrame(identities)

# Generate applications data
def generate_applications(n=100):
    applications = []

    # Define real-world apps by category
    app_categories = [
        'Productivity', 'CRM', 'HR', 'Finance', 'Collaboration',
        'Analytics', 'Marketing', 'DevOps', 'Security', 'Project Management',
        'Communication', 'Sales', 'Customer Support', 'Design', 'Infrastructure'
    ]

    vendor_names = [
        'Microsoft', 'Google', 'Salesforce', 'Adobe', 'Oracle', 'IBM', 'SAP', 'ServiceNow',
        'Atlassian', 'Slack', 'Zoom', 'Cisco', 'Dropbox', 'Box', 'DocuSign', 'Workday',
        'HubSpot', 'Zendesk', 'Shopify', 'Asana', 'Monday.com', 'Notion', 'Figma', 'Miro',
        'Airtable', 'Zapier', 'QuickBooks', 'NetSuite', 'Xero', 'Stripe', 'Okta', 'Auth0',
        'GitHub', 'GitLab', 'BitBucket', 'CircleCI', 'Jenkins', 'AWS', 'Azure', 'GCP'
    ]

    for i in range(n):
        app_id = i + 1
        app_category = random.choice(app_categories)
        vendor_name = random.choice(vendor_names)

        # Create app name based on vendor and category
        app_name = f"{vendor_name} {app_category}" if random.random() < 0.7 else fake.company() + " " + app_category

        applications.append({
            'id': app_id,
            'app_name': app_name,
            'app_category': app_category,
            'app_description': fake.paragraph(nb_sentences=3)
        })

    return pd.DataFrame(applications)

# Generate app instances (renamed from domain_applications)
def generate_app_instances(applications_df, n=150):
    app_instances = []

    apps = applications_df.to_dict('records')

    app_statuses = ['APPROVED', 'NEEDS_REVIEW', 'DISCOVERED', 'DEPRECATED', 'BLOCKLISTED']
    status_weights = [0.6, 0.15, 0.1, 0.1, 0.05]

    discovery_sources = ['SSO', 'API Integration', 'Network Scan', 'User Survey', 'Expense Report']

    for i in range(n):
        app = random.choice(apps)

        is_shadow_it = random.random() < 0.2
        is_in_app_store = random.random() < 0.7

        status = random.choices(app_statuses, weights=status_weights)[0]

        # Create instance label with some variety
        instance_types = ['Enterprise', 'Team', 'Department', 'Project', 'Dev', 'Test', 'Staging', 'Production']
        instance_label = f"{app['app_name']} {random.choice(instance_types)}" if random.random() < 0.7 else app['app_name']

        # Select random sources for discovery
        num_sources = random.randint(1, 3)
        selected_sources = random.sample(discovery_sources, num_sources)

        app_instances.append({
            'id': i + 1,
            'app_id': app['id'],
            'instance_label': instance_label,
            'domain_app_status': status,
            'is_shadow_it': is_shadow_it,
            'is_in_app_store': is_in_app_store,
            'discovery_sources': ', '.join(selected_sources),
            'discovered_at': fake.date_time_between(start_date='-1y', end_date='now').isoformat(),
        })

    return pd.DataFrame(app_instances)

# Generate app sources data
def generate_app_sources(app_instances_df, n=200):
    app_sources = []
    source_types = ['LUMOS_INTEGRATION', 'GSUITE_DEEP_INBOX', 'GSUITE_OAUTH', 'OKTA', 'GOOGLE_CLOUD', 'MANUAL', 'MICROSOFT_OAUTH']

    app_instance_ids = app_instances_df['id'].tolist()

    for i in range(n):
        app_instance_id = random.choice(app_instance_ids)
        source_name = random.choice(source_types)

        app_sources.append({
            'app_source_id': i + 1,
            'app_source_name': source_name,
            'app_instance_id': app_instance_id
        })

    return pd.DataFrame(app_sources)

# Generate accounts data (user-app instance links)
def generate_accounts(identities_df, app_instances_df, n=800):
    accounts = []

    active_identities = identities_df[identities_df['status'] == 'ACTIVE']['id'].tolist()
    app_instance_ids = app_instances_df['id'].tolist()

    account_statuses = ['ACTIVE', 'SUSPENDED']
    status_weights = [0.75, 0.25]

    # Track user-app combinations to avoid duplicates
    used_combos = set()

    for i in range(n):
        # Keep trying until we get a unique user-app combination
        while True:
            user_id = random.choice(active_identities)
            app_instance_id = random.choice(app_instance_ids)

            combo = (user_id, app_instance_id)
            if combo not in used_combos:
                used_combos.add(combo)
                break

        account_status = random.choices(account_statuses, weights=status_weights)[0]

        # Generate last activity date
        if account_status == 'ACTIVE':
            # Active accounts have recent activity
            last_activity = fake.date_time_between(start_date='-30d', end_date='now')
        else:
            # Inactive accounts have older activity dates
            last_activity = fake.date_time_between(start_date='-180d', end_date='-30d')

        is_matched = random.random() < 0.95  # 95% of accounts are matched to identities
        is_admin = random.random() < 0.15    # 15% of accounts are admin accounts

        accounts.append({
            'id': i + 1,
            'user_id': user_id,
            'app_instance_id': app_instance_id,
            'account_status': account_status,
            'last_activity_dt': last_activity.isoformat(),
            'is_matched': is_matched,
            'is_admin': is_admin
        })

    return pd.DataFrame(accounts)

# Generate licenses data
def generate_licenses(accounts_df, n=400):
    licenses = []

    license_names = ['Basic User', 'Standard User', 'Premium User', 'Enterprise Access', 'Developer License',
                     'Admin License', 'Full Access', 'Limited Access', 'Read-Only', 'Power User']

    # Convert accounts to records for easier lookup
    accounts_records = accounts_df.to_dict('records')
    account_ids = accounts_df['id'].tolist()

    for i in range(n):
        account_id = random.choice(account_ids)

        # Find the account record to get its app_instance_id
        account = next(acc for acc in accounts_records if acc['id'] == account_id)
        app_instance_id = account['app_instance_id']

        # Get account info to determine dates
        assigned_date = fake.date_time_between(start_date='-1y', end_date='-1m')
        end_date = assigned_date + timedelta(days=random.choice([90, 180, 365, 730]))

        unit_annual_cost = random.choice([0, 15, 50, 150, 450, 1200, 2500])
        is_privileged = random.random() < 0.2
        purchased_quantity = random.randint(1, 10)

        licenses.append({
            'id': i + 1,
            'license_name': random.choice(license_names),
            'account_id': account_id,
            'app_instance_id': app_instance_id,
            'assigned_date': assigned_date.isoformat(),
            'end_date': end_date.isoformat(),
            'unit_annual_cost': unit_annual_cost,
            'is_privileged': is_privileged,
            'purchased_quantity': purchased_quantity
        })

    return pd.DataFrame(licenses)

if __name__ == '__main__':
    # Generate data
    departments_df = generate_departments()
    identities_df = generate_identities(departments_df)
    applications_df = generate_applications()
    app_instances_df = generate_app_instances(applications_df)
    app_sources_df = generate_app_sources(app_instances_df)
    accounts_df = generate_accounts(identities_df, app_instances_df)
    licenses_df = generate_licenses(accounts_df)

    # Save to SQLite
    departments_df.to_sql('dim_departments', conn, if_exists='replace', index=False)
    identities_df.to_sql('dim_identities', conn, if_exists='replace', index=False)
    applications_df.to_sql('fact_applications', conn, if_exists='replace', index=False)
    app_instances_df.to_sql('dim_domain_applications', conn, if_exists='replace', index=False)
    app_sources_df.to_sql('fact_app_sources', conn, if_exists='replace', index=False)
    accounts_df.to_sql('fct_accounts', conn, if_exists='replace', index=False)
    licenses_df.to_sql('fct_licenses', conn, if_exists='replace', index=False)

    print("SaaS management sample data generated successfully!")
    conn.close()
