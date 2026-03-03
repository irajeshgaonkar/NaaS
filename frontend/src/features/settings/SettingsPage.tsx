import { Alert, Card, CardContent, Stack, Typography } from '@mui/material';
import { PageHeader } from '../../components/common/PageHeader';
import { useAuthStore } from '../../store/authStore';

export default function SettingsPage() {
  const user = useAuthStore((state) => state.user);

  return (
    <>
      <PageHeader title="Settings" subtitle="Environment profile and role simulation controls" />
      <Card>
        <CardContent>
          <Stack spacing={1}>
            <Typography variant="body1">Current user: {user.name}</Typography>
            <Typography variant="body2" color="text.secondary">
              Email: {user.email}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Role: {user.role}
            </Typography>
            <Alert severity="info">Use the top bar role selector to validate role-based routing and access controls.</Alert>
          </Stack>
        </CardContent>
      </Card>
    </>
  );
}
