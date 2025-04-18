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
            'department_id': i + 1,
            'department_name': department_names[i],
            'cost_center_code': f"CC-{random.randint(1000, 9999)}"
        })
    return pd.DataFrame(departments)

# Generate users data
def generate_users(departments_df, n=200):
    users = []
    statuses = ['ACTIVE', 'TERMINATED', 'ON_LEAVE']
    status_weights = [0.85, 0.1, 0.05]  # 85% active
    teams = ['Frontend', 'Backend', 'DevOps', 'QA', 'UX', 'Sales', 'Marketing', 'Finance', 'HR']

    # First create some managers
    manager_ids = []
    for i in range(10):
        user_id = i + 1
        manager_ids.append(user_id)
        department = random.choice(departments_df['department_id'].tolist())
        start_date = fake.date_between(start_date='-5y', end_date='-1y')

        users.append({
            'user_id': user_id,
            'full_name_precomputed': fake.name(),
            'email': fake.email(),
            'team': random.choice(teams),
            'status': random.choices(statuses, weights=status_weights)[0],
            'department_id': department,
            'manager_id': None,  # Top-level managers have no manager
            'start_date': start_date,
            'end_date': None if random.random() < 0.95 else fake.date_between(start_date=start_date, end_date='today')
        })

    # Then create the rest of the users
    for i in range(10, n):
        user_id = i + 1
        department = random.choice(departments_df['department_id'].tolist())
        manager_id = random.choice(manager_ids)
        start_date = fake.date_between(start_date='-3y', end_date='-1m')

        users.append({
            'user_id': user_id,
            'full_name_precomputed': fake.name(),
            'email': fake.email(),
            'team': random.choice(teams),
            'status': random.choices(statuses, weights=status_weights)[0],
            'department_id': department,
            'manager_id': manager_id,
            'start_date': start_date,
            'end_date': None if random.random() < 0.95 else fake.date_between(start_date=start_date, end_date='today')
        })

    return pd.DataFrame(users)

# Generate vendors data
def generate_vendors(n=50):
    vendors = []

    vendor_names = [
        'Microsoft', 'Google', 'Salesforce', 'Adobe', 'Oracle', 'IBM', 'SAP', 'ServiceNow',
        'Atlassian', 'Slack', 'Zoom', 'Cisco', 'Dropbox', 'Box', 'DocuSign', 'Workday',
        'HubSpot', 'Zendesk', 'Shopify', 'Asana', 'Monday.com', 'Notion', 'Figma', 'Miro',
        'Airtable', 'Zapier', 'QuickBooks', 'NetSuite', 'Xero', 'Stripe', 'Okta', 'Auth0',
        'GitHub', 'GitLab', 'BitBucket', 'CircleCI', 'Jenkins', 'AWS', 'Azure', 'GCP',
        'DigitalOcean', 'Heroku', 'Twilio', 'SendGrid', 'Mailchimp', 'Intercom', 'Segment', 'Amplitude',
        'NewRelic', 'Datadog'
    ]

    for i in range(min(n, len(vendor_names))):
        vendors.append({
            'vendor_id': i + 1,
            'vendor_name': vendor_names[i]
        })

    return pd.DataFrame(vendors)

# Generate base applications data
def generate_applications(vendors_df, n=100):
    applications = []

    # Define real-world apps by category
    app_categories = [
        'Productivity', 'CRM', 'HR', 'Finance', 'Collaboration',
        'Analytics', 'Marketing', 'DevOps', 'Security', 'Project Management',
        'Communication', 'Sales', 'Customer Support', 'Design', 'Infrastructure'
    ]

    vendor_ids = vendors_df['vendor_id'].tolist()

    for i in range(n):
        app_id = str(uuid.uuid4())
        app_category = random.choice(app_categories)
        vendor_id = random.choice(vendor_ids)
        vendor_name = vendors_df[vendors_df['vendor_id'] == vendor_id]['vendor_name'].iloc[0]

        # Create app name based on vendor and category
        app_name = f"{vendor_name} {app_category}" if random.random() < 0.7 else fake.company() + " " + app_category

        applications.append({
            'app_id': app_id,
            'app_name': app_name,
            'app_category': app_category,
            'app_description': fake.paragraph(nb_sentences=3),
            'vendor_id': vendor_id
        })

    return pd.DataFrame(applications)

# Generate domain applications (instances of base apps)
def generate_domain_applications(applications_df, departments_df, n=150):
    domain_applications = []

    apps = applications_df.to_dict('records')
    department_ids = departments_df['department_id'].tolist()

    app_statuses = ['APPROVED', 'NEEDS_REVIEW', 'DISCOVERED', 'DEPRECATED', 'BLOCKLISTED']
    status_weights = [0.6, 0.15, 0.1, 0.1, 0.05]

    discovery_sources = ['SSO', 'API Integration', 'Network Scan', 'User Survey', 'Expense Report']

    for i in range(n):
        app = random.choice(apps)

        is_potential_shadow_it = random.random() < 0.2
        is_explicit_shadow_it = is_potential_shadow_it and random.random() < 0.4
        is_low_usage = random.random() < 0.25

        status = random.choices(app_statuses, weights=status_weights)[0]
        if is_explicit_shadow_it and status == 'APPROVED':
            status = random.choice(['NEEDS_REVIEW', 'DEPRECATED'])

        # Create instance label with some variety
        instance_types = ['Enterprise', 'Team', 'Department', 'Project', 'Dev', 'Test', 'Staging', 'Production']
        instance_label = f"{app['app_name']} {random.choice(instance_types)}" if random.random() < 0.7 else app['app_name']

        # Create some app configurations
        configs = ['Standard', 'Custom', 'Basic', 'Premium', 'Enterprise']

        # Select random sources for discovery
        num_sources = random.randint(1, 3)
        selected_sources = random.sample(discovery_sources, num_sources)

        # Calculate user counts for the domain app
        num_users = random.randint(5, 50)
        active_users = int(num_users * random.uniform(0.6, 0.95))

        domain_applications.append({
            'domain_app_id': i + 1,
            'domain_id': 1,  # Assuming single domain for simplicity
            'app_id': app['app_id'],
            'instance_label': instance_label,
            'domain_app_status': status,
            'app_configuration': random.choice(configs),
            'is_potential_shadow_it': is_potential_shadow_it,
            'is_explicit_shadow_it': is_explicit_shadow_it,
            'is_low_usage': is_low_usage,
            'discovery_sources': ', '.join(selected_sources),
            'discovered_at': fake.date_time_between(start_date='-1y', end_date='now').isoformat(),
            'final_category': app['app_category'],  # Could be overridden in some cases
            'primary_department_id': random.choice(department_ids),
            'num_users_in_domain': num_users,
            'num_users_with_active_status': active_users
        })

    return pd.DataFrame(domain_applications)

# Generate contract licenses data
def generate_contract_licenses(domain_applications_df, n=200):
    contract_licenses = []

    domain_app_ids = domain_applications_df['domain_app_id'].tolist()
    license_types = ['SEAT_LICENSE', 'USAGE_BASED', 'SITE_LICENSE', 'CONCURRENT_LICENSE']
    pay_periods = ['MONTHLY', 'QUARTERLY', 'ANNUAL', 'MULTI_YEAR']

    # Generate some contracts first
    contracts = []
    for i in range(50):
        contract_id = i + 1
        domain_app_id = random.choice(domain_app_ids)

        # Get info about this domain app
        domain_app = domain_applications_df[domain_applications_df['domain_app_id'] == domain_app_id].iloc[0]

        # Contract start date typically before discovery date
        contract_start = fake.date_time_between(start_date='-2y', end_date='-6m')
        contract_duration = random.choice([1, 2, 3])  # Years
        contract_end = contract_start + timedelta(days=365 * contract_duration)

        # Add to contracts list (could be stored in a separate table)
        contracts.append({
            'contract_id': contract_id,
            'domain_app_id': domain_app_id,
            'start_date': contract_start,
            'end_date': contract_end
        })

    # Now generate license items
    for i in range(n):
        contract = random.choice(contracts)
        contract_id = contract['contract_id']
        domain_app_id = contract['domain_app_id']

        # Find actual domain app to align quantities
        domain_app = domain_applications_df[domain_applications_df['domain_app_id'] == domain_app_id].iloc[0]

        # Base purchased quantity on number of users with some variance
        base_users = domain_app['num_users_in_domain']
        purchased_quantity = max(base_users + random.randint(-10, 20), 1)

        # Calculate costs
        license_type = random.choice(license_types)
        if license_type == 'SEAT_LICENSE':
            cost_per_license = random.uniform(50, 500)
        elif license_type == 'USAGE_BASED':
            cost_per_license = random.uniform(0.10, 5.0)
            purchased_quantity = random.randint(1000, 10000)  # API calls, etc.
        elif license_type == 'SITE_LICENSE':
            cost_per_license = random.uniform(5000, 50000)
            purchased_quantity = 1  # Site licenses cover the whole org
        else:  # CONCURRENT_LICENSE
            cost_per_license = random.uniform(200, 800)
            purchased_quantity = max(int(base_users * 0.4), 5)  # Fewer needed

        # Calculate used quantity based on active users with some randomness
        # For seat licenses, it's related to active users
        if license_type == 'SEAT_LICENSE':
            active_users = domain_app['num_users_with_active_status']
            # Sometimes we use more than purchased (overuse), sometimes less (underuse)
            usage_ratio = random.uniform(0.7, 1.1)
            used_quantity = int(active_users * usage_ratio)
        elif license_type == 'USAGE_BASED':
            # Usage based licenses often have different utilization patterns
            used_quantity = int(purchased_quantity * random.uniform(0.4, 0.95))
        elif license_type == 'SITE_LICENSE':
            # Site licenses are fully used since they cover the whole org
            used_quantity = 1
        else:  # CONCURRENT_LICENSE
            # Concurrent licenses usually have a higher utilization rate
            used_quantity = int(purchased_quantity * random.uniform(0.6, 0.95))

        pay_period = random.choice(pay_periods)

        # Adjust cost based on payment period
        period_multiplier = {
            'MONTHLY': 1,
            'QUARTERLY': 3,
            'ANNUAL': 12,
            'MULTI_YEAR': 24
        }

        # Calculate total cost for the period
        total_cost = cost_per_license * purchased_quantity * period_multiplier[pay_period]

        # Calculate annual cost per license for comparison
        annual_multiplier = 12 / period_multiplier[pay_period]
        cost_per_license_annual = cost_per_license * annual_multiplier

        contract_licenses.append({
            'line_item_id': i + 1,
            'contract_id': contract_id,
            'domain_app_id': domain_app_id,
            'license_type': license_type,
            'pay_period': pay_period,
            'start_date': contract['start_date'].isoformat(),
            'end_date': contract['end_date'].isoformat(),
            'purchased_quantity': purchased_quantity,
            'used_quantity': used_quantity,
            'total_cost': round(total_cost, 2),
            'cost_per_license_annual': round(cost_per_license_annual, 2)
        })

    return pd.DataFrame(contract_licenses)

# Generate accounts (user-app links)
def generate_accounts(users_df, domain_applications_df, n=800):
    accounts = []

    active_users = users_df[users_df['status'] == 'ACTIVE']['user_id'].tolist()
    domain_app_ids = domain_applications_df['domain_app_id'].tolist()

    status_types = ['ACTIVE', 'INACTIVE', 'PENDING', 'SUSPENDED']
    status_weights = [0.75, 0.15, 0.05, 0.05]

    # Track user-app combinations to avoid duplicates
    used_combos = set()

    for i in range(n):
        # Keep trying until we get a unique user-app combination
        while True:
            user_id = random.choice(active_users)
            domain_app_id = random.choice(domain_app_ids)

            combo = (user_id, domain_app_id)
            if combo not in used_combos:
                used_combos.add(combo)
                break

        account_status = random.choices(status_types, weights=status_weights)[0]

        # Generate last activity date
        if account_status == 'ACTIVE':
            # Active accounts have recent activity
            last_activity = fake.date_time_between(start_date='-30d', end_date='now')
            last_login = fake.date_time_between(start_date='-60d', end_date=last_activity)
        else:
            # Inactive accounts have older activity dates
            last_activity = fake.date_time_between(start_date='-180d', end_date='-30d')
            last_login = fake.date_time_between(start_date='-190d', end_date=last_activity)

        # Determine if dormant based on last activity
        is_dormant = (datetime.now() - last_activity).days > 90

        accounts.append({
            'account_id': i + 1,
            'user_id': user_id,
            'domain_app_id': domain_app_id,
            'account_status': account_status,
            'last_activity_dt': last_activity.isoformat(),
            'last_login_dt': last_login.isoformat(),
            'is_dormant': is_dormant
        })

    return pd.DataFrame(accounts)

# Generate usage activity data
def generate_usage_activity(accounts_df, n=5000):
    usage_activity = []
    activity_types = ['Login', 'DataAccess', 'Report', 'Configuration', 'DataEntry', 'Export', 'Import', 'Search']

    # Get accounts data
    accounts = accounts_df.to_dict('records')

    for i in range(n):
        # Randomly select an account
        account = random.choice(accounts)

        # Generate activity timestamp in the last 60 days (higher concentration in last 30)
        if random.random() < 0.8:  # 80% in last 30 days
            activity_ts = fake.date_time_between(start_date='-30d', end_date='now')
        else:
            activity_ts = fake.date_time_between(start_date='-60d', end_date='-30d')

        usage_activity.append({
            'event_id': str(uuid.uuid4()),
            'user_id': account['user_id'],
            'domain_app_id': account['domain_app_id'],
            'activity_ts': activity_ts.isoformat(),
            'activity_type': random.choice(activity_types)
        })

    return pd.DataFrame(usage_activity)

if __name__ == '__main__':
    # Generate data
    departments_df = generate_departments()
    vendors_df = generate_vendors()
    users_df = generate_users(departments_df)
    applications_df = generate_applications(vendors_df)
    domain_applications_df = generate_domain_applications(applications_df, departments_df)
    contract_licenses_df = generate_contract_licenses(domain_applications_df)
    accounts_df = generate_accounts(users_df, domain_applications_df)
    usage_activity_df = generate_usage_activity(accounts_df)

    # Save to SQLite
    departments_df.to_sql('dim_departments', conn, if_exists='replace', index=False)
    vendors_df.to_sql('dim_vendors', conn, if_exists='replace', index=False)
    users_df.to_sql('dim_users', conn, if_exists='replace', index=False)
    applications_df.to_sql('dim_applications', conn, if_exists='replace', index=False)
    domain_applications_df.to_sql('dim_domain_applications', conn, if_exists='replace', index=False)
    contract_licenses_df.to_sql('fct_contract_licenses', conn, if_exists='replace', index=False)
    accounts_df.to_sql('fct_accounts', conn, if_exists='replace', index=False)
    usage_activity_df.to_sql('fct_usage_activity', conn, if_exists='replace', index=False)

    print("SaaS management sample data generated successfully!")
    conn.close()
