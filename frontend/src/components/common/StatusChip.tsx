import { Chip } from '@mui/material';

interface StatusChipProps {
  label: string;
  tone?: 'success' | 'warning' | 'error' | 'default' | 'info';
}

export const StatusChip = ({ label, tone = 'default' }: StatusChipProps) => (
  <Chip size="small" color={tone} label={label} variant={tone === 'default' ? 'outlined' : 'filled'} />
);
