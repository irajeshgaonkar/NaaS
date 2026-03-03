import { ReactNode } from 'react';
import DashboardOutlinedIcon from '@mui/icons-material/DashboardOutlined';
import GroupsOutlinedIcon from '@mui/icons-material/GroupsOutlined';
import DescriptionOutlinedIcon from '@mui/icons-material/DescriptionOutlined';
import RuleOutlinedIcon from '@mui/icons-material/RuleOutlined';
import LayersOutlinedIcon from '@mui/icons-material/LayersOutlined';
import BoltOutlinedIcon from '@mui/icons-material/BoltOutlined';
import SubscriptionsOutlinedIcon from '@mui/icons-material/SubscriptionsOutlined';
import WarningAmberOutlinedIcon from '@mui/icons-material/WarningAmberOutlined';
import SummarizeOutlinedIcon from '@mui/icons-material/SummarizeOutlined';
import HistoryOutlinedIcon from '@mui/icons-material/HistoryOutlined';
import SettingsOutlinedIcon from '@mui/icons-material/SettingsOutlined';
import { UserRole } from '../services/models';

export interface NavItem {
  label: string;
  path: string;
  icon: ReactNode;
  allowedRoles: UserRole[];
}

export const navItems: NavItem[] = [
  { label: 'Dashboard', path: '/dashboard', icon: <DashboardOutlinedIcon />, allowedRoles: ['admin', 'manager', 'user'] },
  { label: 'Teams', path: '/teams', icon: <GroupsOutlinedIcon />, allowedRoles: ['admin', 'manager', 'user'] },
  { label: 'Templates', path: '/templates', icon: <DescriptionOutlinedIcon />, allowedRoles: ['admin', 'manager', 'user'] },
  { label: 'Rules', path: '/rules', icon: <RuleOutlinedIcon />, allowedRoles: ['admin', 'manager', 'user'] },
  { label: 'Rule Groups', path: '/rule-groups', icon: <LayersOutlinedIcon />, allowedRoles: ['admin', 'manager', 'user'] },
  { label: 'Triggers', path: '/triggers', icon: <BoltOutlinedIcon />, allowedRoles: ['admin', 'manager'] },
  { label: 'Subscriptions', path: '/subscriptions', icon: <SubscriptionsOutlinedIcon />, allowedRoles: ['admin', 'manager', 'user'] },
  { label: 'System Alerts', path: '/system-alerts', icon: <WarningAmberOutlinedIcon />, allowedRoles: ['admin', 'manager'] },
  { label: 'Digest Configuration', path: '/digest-configuration', icon: <SummarizeOutlinedIcon />, allowedRoles: ['admin', 'manager'] },
  { label: 'Audit Logs', path: '/audit-logs', icon: <HistoryOutlinedIcon />, allowedRoles: ['admin', 'manager'] },
  { label: 'Settings', path: '/settings', icon: <SettingsOutlinedIcon />, allowedRoles: ['admin', 'manager', 'user'] },
];
