import { Button, Stack, Typography } from '@mui/material';
import { useNavigate } from 'react-router-dom';

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <Stack spacing={2} alignItems="start">
      <Typography variant="h4">Page not found</Typography>
      <Typography variant="body2" color="text.secondary">
        The requested route does not exist.
      </Typography>
      <Button variant="contained" onClick={() => navigate('/dashboard')}>
        Go to Dashboard
      </Button>
    </Stack>
  );
}
