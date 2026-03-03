import MenuIcon from '@mui/icons-material/Menu';
import { AppBar, Box, FormControl, IconButton, InputLabel, MenuItem, Select, SelectChangeEvent, Toolbar, Typography } from '@mui/material';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../services/models';

interface TopBarProps {
  onMenuClick: () => void;
}

export const TopBar = ({ onMenuClick }: TopBarProps) => {
  const user = useAuthStore((state) => state.user);
  const setRole = useAuthStore((state) => state.setRole);

  const handleRoleChange = (event: SelectChangeEvent) => {
    setRole(event.target.value as UserRole);
  };

  return (
    <AppBar position="fixed" color="inherit" elevation={1} sx={{ zIndex: (theme) => theme.zIndex.drawer + 1 }}>
      <Toolbar sx={{ display: 'flex', justifyContent: 'space-between', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <IconButton sx={{ display: { md: 'none' } }} onClick={onMenuClick}>
            <MenuIcon />
          </IconButton>
          <Typography sx={{ fontWeight: 700, color: 'primary.main' }}>
            NaaS
          </Typography>
          <Typography sx={{ fontWeight: 600 }}>
            Admin Portal
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Enterprise Notification Lifecycle
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            {user.name}
          </Typography>
          <FormControl size="small" sx={{ minWidth: 180 }}>
            <InputLabel id="role-select-label">Simulate Role</InputLabel>
            <Select labelId="role-select-label" label="Simulate Role" value={user.role} onChange={handleRoleChange}>
              <MenuItem value="admin">Notification Admin</MenuItem>
              <MenuItem value="manager">Notification Manager</MenuItem>
              <MenuItem value="user">Notification User</MenuItem>
            </Select>
          </FormControl>
        </Box>
      </Toolbar>
    </AppBar>
  );
};
