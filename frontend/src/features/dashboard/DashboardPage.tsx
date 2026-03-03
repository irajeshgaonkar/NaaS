import { Card, CardContent, Grid, List, ListItem, ListItemText, Typography } from '@mui/material';
import { PageHeader } from '../../components/common/PageHeader';
import { StatCard } from '../../components/cards/StatCard';
import { useDashboardStats, useRecentActivity } from '../../hooks/useNaasQueries';

export default function DashboardPage() {
  const { data: stats } = useDashboardStats();
  const { data: activities } = useRecentActivity();

  return (
    <>
      <PageHeader title="Dashboard" subtitle="Operational snapshot for Notification as a Service" />

      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard label="Total Teams" value={stats?.totalTeams ?? '-'} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard label="Active Rules" value={stats?.activeRules ?? '-'} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard label="Notifications Sent" value={stats?.notificationsSent?.toLocaleString() ?? '-'} />
        </Grid>
        <Grid item xs={12} sm={6} lg={3}>
          <StatCard label="Failed Notifications" value={stats?.failedNotifications ?? '-'} />
        </Grid>
      </Grid>

      <Card>
        <CardContent>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Recent Activity
          </Typography>
          <List>
            {(activities ?? []).map((activity) => (
              <ListItem key={activity.id} divider>
                <ListItemText
                  primary={activity.message}
                  secondary={`${activity.actor} • ${new Date(activity.timestamp).toLocaleString()}`}
                />
              </ListItem>
            ))}
          </List>
        </CardContent>
      </Card>
    </>
  );
}
