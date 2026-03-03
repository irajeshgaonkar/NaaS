import { Box, Divider, Drawer, List, ListItemButton, ListItemIcon, ListItemText, Toolbar, Typography } from '@mui/material';
import { useLocation, useNavigate } from 'react-router-dom';
import { navItems } from '../routes/routeConfig';
import { useAuthStore } from '../store/authStore';
import { appDrawerWidth } from './constants';

interface SidebarNavProps {
  mobileOpen: boolean;
  onClose: () => void;
}

export const SidebarNav = ({ mobileOpen, onClose }: SidebarNavProps) => {
  const role = useAuthStore((state) => state.user.role);
  const navigate = useNavigate();
  const location = useLocation();

  const allowedNavItems = navItems.filter((item) => item.allowedRoles.includes(role));

  const drawerContent = (
    <>
      <Toolbar />
      <Box sx={{ px: 2, pb: 1 }}>
        <Typography variant="overline" color="text.secondary">
          Navigation
        </Typography>
      </Box>
      <Divider />
      <List>
        {allowedNavItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItemButton key={item.path} selected={active} onClick={() => navigate(item.path)}>
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          );
        })}
      </List>
    </>
  );

  return (
    <>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={onClose}
        ModalProps={{ keepMounted: true }}
        sx={{ display: { xs: 'block', md: 'none' }, '& .MuiDrawer-paper': { width: appDrawerWidth } }}
      >
        {drawerContent}
      </Drawer>
      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: 'none', md: 'block' },
          '& .MuiDrawer-paper': { width: appDrawerWidth, boxSizing: 'border-box' },
        }}
      >
        {drawerContent}
      </Drawer>
    </>
  );
};
