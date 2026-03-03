import { createTheme } from '@mui/material/styles';

export const appTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#0B5CAB', dark: '#084987', light: '#3A7CC0' },
    secondary: { main: '#0F766E', dark: '#0C5B54', light: '#3B918A' },
    success: { main: '#1D7A46' },
    warning: { main: '#B56A00' },
    error: { main: '#C0392B' },
    info: { main: '#1E6BB8' },
    text: {
      primary: '#0F172A',
      secondary: '#475569',
    },
    divider: '#E2E8F0',
    background: {
      default: '#F4F6F8',
      paper: '#FFFFFF',
    },
  },
  shape: { borderRadius: 10 },
  typography: {
    fontFamily: '"Segoe UI", "Helvetica Neue", Arial, sans-serif',
    h4: { fontWeight: 700, letterSpacing: 0.1 },
    h5: { fontWeight: 700, letterSpacing: 0.1 },
    h6: { fontWeight: 700, letterSpacing: 0.1 },
    subtitle1: { fontWeight: 600 },
    subtitle2: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
  },
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          background: 'linear-gradient(180deg, #F8FAFC 0%, #F4F6F8 220px)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          borderBottom: '1px solid #E2E8F0',
          backgroundColor: '#FFFFFF',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          borderRight: '1px solid #E2E8F0',
          backgroundColor: '#F8FAFC',
        },
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&.Mui-selected': {
            backgroundColor: '#DCEAF9',
            color: '#0B5CAB',
            '& .MuiListItemIcon-root': {
              color: '#0B5CAB',
            },
          },
          '&:hover': {
            backgroundColor: '#EDF4FB',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 10px rgba(15, 23, 42, 0.06)',
          border: '1px solid #E5EAF1',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          boxShadow: 'none',
        },
        containedPrimary: {
          '&:hover': {
            boxShadow: '0 4px 12px rgba(11, 92, 171, 0.28)',
          },
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: 'small',
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
  },
});
