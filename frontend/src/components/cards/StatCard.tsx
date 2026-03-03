import { Card, CardContent, Typography } from '@mui/material';

interface StatCardProps {
  label: string;
  value: string | number;
}

export const StatCard = ({ label, value }: StatCardProps) => (
  <Card>
    <CardContent>
      <Typography color="text.secondary" variant="body2">
        {label}
      </Typography>
      <Typography variant="h4">{value}</Typography>
    </CardContent>
  </Card>
);
