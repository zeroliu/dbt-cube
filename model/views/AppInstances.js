view('AppInstancesView', {
  description: 'App Instances',
  cubes: [
    {
      join_path: AppInstanceSnapshots,
      includes: [
        'instanceId',
        'instanceStatus',
        'appName',
        'appCategory',
        'snapshotDate',
        {
          name: 'count',
          alias: 'countAppInstances',
        },
        {
          name: 'createdDate',
          alias: 'appInstanceCreatedDate',
        },
        {
          name: 'isShadowIt',
          alias: 'isShadowItAppInstance',
        },
      ],
    },
    {
      join_path: AppInstanceSnapshots.AccountSnapshots,
      includes: [
        'accountId',
        'accountStatus',
        {
          name: 'count',
          alias: 'countAccounts',
        },
        {
          name: 'isAdmin',
          alias: 'isAdminAccount',
        },
        {
          name: 'isMatched',
          alias: 'isMatchedAccount',
        },
        {
          name: 'lastActivityDate',
          alias: 'accountLastActivityDate',
        },
      ],
    },
    {
      join_path: AppInstanceSnapshots.AccountSnapshots.IdentitySnapshots,
      includes: [
        'identityId',
        'identityStatus',
        {
          name: 'count',
          alias: 'countIdentities',
        },
        {
          name: 'email',
          alias: 'identityEmail',
        },
        {
          name: 'fullName',
          alias: 'identityFullName',
        },
        {
          name: 'team',
          alias: 'identityTeam',
        },
        {
          name: 'startDate',
          alias: 'identityStartDate',
        },
        {
          name: 'endDate',
          alias: 'identityEndDate',
        },
        {
          name: 'managerName',
          alias: 'identityManagerName',
        },
      ],
    },
  ],
});
