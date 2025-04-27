view('IdentitiesView', {
  description: 'Identities',
  cubes: [
    {
      join_path: IdentitySnapshots,
      includes: [
        'identityId',
        'identityStatus',
        'snapshotDate',
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
    {
      join_path: IdentitySnapshots.AccountSnapshots,
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
      join_path: IdentitySnapshots.AccountSnapshots.AppInstanceSnapshots,
      includes: [
        'instanceId',
        'instanceStatus',
        'appName',
        'appCategory',
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
  ],
});
