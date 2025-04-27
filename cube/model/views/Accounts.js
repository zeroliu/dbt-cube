view('AccountsView', {
  description: 'Accounts',
  cubes: [
    {
      join_path: AccountSnapshots,
      includes: [
        'accountId',
        'accountStatus',
        'snapshotDate',
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
      join_path: AccountSnapshots.AppInstanceSnapshots,
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

    {
      join_path: AccountSnapshots.IdentitySnapshots,
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
