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
            'id': str(uuid.uuid4()),
            'department_name': department_names[i],
            'cost_center_code': f"CC-{random.randint(1000, 9999)}"
        })
    return pd.DataFrame(departments)

# Generate users data
def generate_users(departments_df, n=200):
    users = []
    employment_statuses = ['Active', 'Terminated', 'On Leave']
    status_weights = [0.85, 0.1, 0.05]  # 85% active

    for _ in range(n):
        department = random.choice(departments_df['id'].tolist())
        users.append({
            'user_id': str(uuid.uuid4()),
            'user_name': fake.name(),
            'user_email': fake.email(),
            'employment_status': random.choices(employment_statuses, weights=status_weights)[0],
            'department_id': department
        })
    return pd.DataFrame(users)

# Generate applications data
def generate_applications(departments_df, n=100):
    applications = []

    # Define real-world apps by category
    real_apps = {
        'Productivity': [
            {'name': 'Microsoft Office 365', 'vendor': 'Microsoft'},
            {'name': 'Google Workspace', 'vendor': 'Google'},
            {'name': 'Notion', 'vendor': 'Notion Labs'},
            {'name': 'Evernote', 'vendor': 'Evernote Corporation'},
            {'name': 'Asana', 'vendor': 'Asana Inc'},
            {'name': 'Monday.com', 'vendor': 'Monday.com Ltd'}
        ],
        'CRM': [
            {'name': 'Salesforce', 'vendor': 'Salesforce Inc'},
            {'name': 'HubSpot', 'vendor': 'HubSpot Inc'},
            {'name': 'Zoho CRM', 'vendor': 'Zoho Corporation'},
            {'name': 'Pipedrive', 'vendor': 'Pipedrive Inc'},
            {'name': 'Close', 'vendor': 'Close.io Inc'}
        ],
        'HR': [
            {'name': 'Workday', 'vendor': 'Workday Inc'},
            {'name': 'BambooHR', 'vendor': 'BambooHR LLC'},
            {'name': 'Gusto', 'vendor': 'Gusto Inc'},
            {'name': 'Lattice', 'vendor': 'Lattice Inc'},
            {'name': 'Culture Amp', 'vendor': 'Culture Amp Pty Ltd'}
        ],
        'Finance': [
            {'name': 'QuickBooks', 'vendor': 'Intuit Inc'},
            {'name': 'Xero', 'vendor': 'Xero Limited'},
            {'name': 'NetSuite', 'vendor': 'Oracle Corporation'},
            {'name': 'Stripe', 'vendor': 'Stripe Inc'},
            {'name': 'Expensify', 'vendor': 'Expensify Inc'}
        ],
        'Collaboration': [
            {'name': 'Slack', 'vendor': 'Salesforce Inc'},
            {'name': 'Microsoft Teams', 'vendor': 'Microsoft'},
            {'name': 'Zoom', 'vendor': 'Zoom Video Communications'},
            {'name': 'Webex', 'vendor': 'Cisco Systems'},
            {'name': 'Discord', 'vendor': 'Discord Inc'}
        ],
        'Analytics': [
            {'name': 'Tableau', 'vendor': 'Salesforce Inc'},
            {'name': 'Power BI', 'vendor': 'Microsoft'},
            {'name': 'Looker', 'vendor': 'Google'},
            {'name': 'Amplitude', 'vendor': 'Amplitude Inc'},
            {'name': 'Mixpanel', 'vendor': 'Mixpanel Inc'}
        ],
        'Marketing': [
            {'name': 'Mailchimp', 'vendor': 'Intuit Inc'},
            {'name': 'Marketo', 'vendor': 'Adobe Inc'},
            {'name': 'Hootsuite', 'vendor': 'Hootsuite Inc'},
            {'name': 'Canva', 'vendor': 'Canva Pty Ltd'},
            {'name': 'Buffer', 'vendor': 'Buffer Inc'}
        ],
        'DevOps': [
            {'name': 'GitHub', 'vendor': 'Microsoft'},
            {'name': 'GitLab', 'vendor': 'GitLab Inc'},
            {'name': 'Jira', 'vendor': 'Atlassian'},
            {'name': 'Linear', 'vendor': 'Linear B Inc'},
            {'name': 'CircleCI', 'vendor': 'CircleCI'}
        ],
        'Security': [
            {'name': 'LastPass', 'vendor': 'GoTo'},
            {'name': '1Password', 'vendor': 'AgileBits Inc'},
            {'name': 'Okta', 'vendor': 'Okta Inc'},
            {'name': 'CrowdStrike', 'vendor': 'CrowdStrike Holdings Inc'},
            {'name': 'KnowBe4', 'vendor': 'KnowBe4 Inc'}
        ]
    }

    categories = list(real_apps.keys())

    # Create some standard apps (for consolidation targets)
    standard_apps = []
    for category in categories:
        is_standard = True
        is_shadow_it = False
        risk_score = random.randint(1, 5)  # Standard apps have lower risk

        # Take the first app in each category as the standard
        app_id = str(uuid.uuid4())
        standard_apps.append(app_id)
        std_app = real_apps[category][0]

        applications.append({
            'id': app_id,
            'app_name': std_app['name'],
            'vendor_name': std_app['vendor'],
            'functional_category': category,
            'is_redundant_flag': False,
            'consolidation_group_id': None,
            'consolidation_status': None,
            'target_standard_app_id': None,
            'risk_score': risk_score,
            'is_shadow_it': is_shadow_it,
            'primary_department_id': random.choice(departments_df['id'].tolist())
        })

    # Create remaining apps
    remaining_apps = n - len(standard_apps)
    consolidation_groups = []

    # Create some consolidation groups
    num_consolidation_groups = min(10, remaining_apps // 3)
    for i in range(num_consolidation_groups):
        consolidation_groups.append(f"CG-{i+1}")

    for i in range(remaining_apps):
        is_shadow_it = random.random() < 0.25  # 25% shadow IT
        is_redundant = random.random() < 0.30  # 30% redundant

        consolidation_group_id = None
        consolidation_status = None
        target_standard_app = None

        # Pick a random category and then a random app from that category
        category = random.choice(categories)
        # Choose from index 1 onwards to avoid using the standard app
        if len(real_apps[category]) > 1:
            app_data = random.choice(real_apps[category][1:])
        else:
            # Fallback in case a category has only one app
            app_data = {'name': f"Alternative {real_apps[category][0]['name']}",
                      'vendor': f"Alternative to {real_apps[category][0]['vendor']}"}

        if is_redundant:
            consolidation_group_id = random.choice(consolidation_groups)
            consolidation_status = random.choice(['Identified', 'Reviewing', 'Scheduled', 'Completed'])
            matching_category = category
            matching_standard_apps = [app for app in applications if app.get('functional_category') == matching_category and app.get('id') in standard_apps]
            if matching_standard_apps:
                target_standard_app = random.choice(matching_standard_apps)['id']

        risk_score = random.randint(1, 10)
        if is_shadow_it:
            risk_score = max(risk_score, 5)  # Shadow IT has at least medium risk

        applications.append({
            'id': str(uuid.uuid4()),
            'app_name': app_data['name'],
            'vendor_name': app_data['vendor'],
            'functional_category': category,
            'is_redundant_flag': is_redundant,
            'consolidation_group_id': consolidation_group_id,
            'consolidation_status': consolidation_status,
            'target_standard_app_id': target_standard_app,
            'risk_score': risk_score,
            'is_shadow_it': is_shadow_it,
            'primary_department_id': random.choice(departments_df['id'].tolist())
        })

    return pd.DataFrame(applications)

# Generate license assignments
def generate_license_assignments(users_df, applications_df, n=800):
    license_assignments = []
    license_tiers = ['Basic', 'Standard', 'Pro', 'Enterprise']

    # Get only active users
    active_users = users_df[users_df['employment_status'] == 'Active']['user_id'].tolist()
    apps = applications_df['id'].tolist()

    for i in range(n):
        user_id = random.choice(active_users)
        app_id = random.choice(apps)

        # Generate assignment date in the last year
        assignment_date = fake.date_time_between(start_date='-1y', end_date='now')

        # Generate a license tier and corresponding cost
        license_tier = random.choice(license_tiers)
        if license_tier == 'Basic':
            cost = random.uniform(50, 200)
        elif license_tier == 'Standard':
            cost = random.uniform(200, 500)
        elif license_tier == 'Pro':
            cost = random.uniform(500, 1000)
        else:  # Enterprise
            cost = random.uniform(1000, 5000)

        # For license utilization calculation, we'll generate last activity timestamp
        # Some licenses will be active, some inactive
        is_active = random.random() < 0.75  # 75% active

        if is_active:
            last_activity = fake.date_time_between(start_date='-30d', end_date='now')
        else:
            # Inactive users - either never used or used a long time ago
            if random.random() < 0.5:
                last_activity = fake.date_time_between(start_date='-1y', end_date='-90d')
            else:
                last_activity = None

        license_assignments.append({
            'assignment_id': str(uuid.uuid4()),
            'user_id': user_id,
            'app_id': app_id,
            'assignment_date': assignment_date.isoformat(),
            'license_tier': license_tier,
            'annual_cost_per_license': round(cost, 2),
            'last_activity_timestamp': last_activity.isoformat() if last_activity else None
        })

    return pd.DataFrame(license_assignments)

# Generate usage activity data
def generate_usage_activity(license_assignments_df, n=5000):
    usage_activity = []
    activity_types = ['Login', 'DataAccess', 'Report', 'Configuration', 'DataEntry', 'Export', 'Import', 'Search']

    # Get all user-app pairs from license assignments
    user_app_pairs = license_assignments_df[['user_id', 'app_id']].drop_duplicates().values.tolist()

    # Activity generation
    for i in range(n):
        # Randomly select a user-app pair
        if user_app_pairs:
            user_id, app_id = random.choice(user_app_pairs)

            # Generate activity timestamp in the last 60 days (higher concentration in last 30)
            if random.random() < 0.8:  # 80% in last 30 days
                activity_ts = fake.date_time_between(start_date='-30d', end_date='now')
            else:
                activity_ts = fake.date_time_between(start_date='-60d', end_date='-30d')

            usage_activity.append({
                'event_id': str(uuid.uuid4()),
                'user_id': user_id,
                'app_id': app_id,
                'activity_ts': activity_ts.isoformat(),
                'activity_type': random.choice(activity_types)
            })

    return pd.DataFrame(usage_activity)

if __name__ == '__main__':
    # Generate data
    departments_df = generate_departments()
    users_df = generate_users(departments_df)
    applications_df = generate_applications(departments_df)
    license_assignments_df = generate_license_assignments(users_df, applications_df)
    usage_activity_df = generate_usage_activity(license_assignments_df)

    # Save to SQLite
    departments_df.to_sql('dim_departments', conn, if_exists='replace', index=False)
    users_df.to_sql('dim_users', conn, if_exists='replace', index=False)
    applications_df.to_sql('dim_applications', conn, if_exists='replace', index=False)
    license_assignments_df.to_sql('fact_license_assignments', conn, if_exists='replace', index=False)
    usage_activity_df.to_sql('fact_usage_activity', conn, if_exists='replace', index=False)

    print("SaaS management sample data generated successfully!")
    conn.close()
