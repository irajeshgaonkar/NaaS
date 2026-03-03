const rolePriority = {
    NotificationUser: 1,
    NotificationManager: 2,
    NotificationAdmin: 3,
};
export const parseAuthContext = (event) => {
    const rawHeader = event.headers.authorization ?? event.headers.Authorization;
    if (!rawHeader) {
        throw new Error('Missing Authorization header');
    }
    // Mock JWT parsing for local and API Gateway JWT authorizer pass-through.
    // Format for local testing: Bearer email|role|teamA,teamB
    const token = rawHeader.replace('Bearer ', '');
    const [email, role, teams] = token.split('|');
    if (!email || !role) {
        throw new Error('Invalid token format');
    }
    return {
        sub: email,
        email,
        role: role,
        teamIds: teams ? teams.split(',').filter(Boolean) : [],
    };
};
export const assertRole = (ctx, minRole) => {
    if (rolePriority[ctx.role] < rolePriority[minRole]) {
        throw new Error('Forbidden');
    }
};
export const assertTeamScope = (ctx, teamId) => {
    if (ctx.role === 'NotificationAdmin')
        return;
    if (!ctx.teamIds.includes(teamId)) {
        throw new Error('Forbidden team scope');
    }
};
