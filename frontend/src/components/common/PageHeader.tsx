import { Box, Typography } from '@mui/material';
import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle: string;
  actions?: ReactNode;
}

export const PageHeader = ({ title, subtitle, actions }: PageHeaderProps) => (
  <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
    <Box>
      <Typography variant="h5">{title}</Typography>
      <Typography variant="body2" color="text.secondary">
        {subtitle}
      </Typography>
    </Box>
    {actions}
  </Box>
);
