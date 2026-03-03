import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { TopBar } from './TopBar';
import { SidebarNav } from './SidebarNav';
import { appDrawerWidth } from './constants';
import { useUiStore } from '../store/uiStore';

export const AppLayout = () => {
  const mobileSidebarOpen = useUiStore((state) => state.mobileSidebarOpen);
  const setMobileSidebarOpen = useUiStore((state) => state.setMobileSidebarOpen);

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <TopBar onMenuClick={() => setMobileSidebarOpen(true)} />
      <SidebarNav mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
      <Box component="main" sx={{ flexGrow: 1, p: 3, ml: { md: `${appDrawerWidth}px` }, bgcolor: 'background.default' }}>
        <Toolbar />
        <Outlet />
      </Box>
    </Box>
  );
};
