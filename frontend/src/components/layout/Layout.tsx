import React, { useState } from 'react';
import { 
  Box, 
  CssBaseline, 
  Divider, 
  Drawer as MuiDrawer, 
  IconButton, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Collapse,
  Container,
  styled, 
  useTheme, 
  Theme, 
  CSSObject,
  useMediaQuery
} from '@mui/material';
import { 
  ChevronLeft as ChevronLeftIcon,
  ChevronRight as ChevronRightIcon,
  ExpandLess as ExpandLessIcon,
  ExpandMore as ExpandMoreIcon
} from '@mui/icons-material';
import { Link, Outlet, useLocation, useNavigate } from 'react-router-dom';
import Header from './Header';
import { menuItems } from './menuConfig';
import Breadcrumbs from '../navigation/Breadcrumbs';

const drawerWidth = 240;

const openedMixin = (theme: Theme): CSSObject => ({
  width: drawerWidth,
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.enteringScreen,
  }),
  overflowX: 'hidden',
});

const closedMixin = (theme: Theme): CSSObject => ({
  transition: theme.transitions.create('width', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  overflowX: 'hidden',
  width: `calc(${theme.spacing(7)} + 1px)`,
  [theme.breakpoints.up('sm')]: {
    width: `calc(${theme.spacing(8)} + 1px)`,
  },
});

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'flex-end',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
}));

const StyledDrawer = styled(MuiDrawer, { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    width: drawerWidth,
    flexShrink: 0,
    whiteSpace: 'nowrap',
    boxSizing: 'border-box',
    ...(open && {
      ...openedMixin(theme),
      '& .MuiDrawer-paper': openedMixin(theme),
    }),
    ...(!open && {
      ...closedMixin(theme),
      '& .MuiDrawer-paper': closedMixin(theme),
    }),
  }),
);

const MainContent = styled('main', {
  shouldForwardProp: (prop) => prop !== 'open',
})<{
  open?: boolean;
}>(({ theme, open }) => ({
  flexGrow: 1,
  padding: theme.spacing(0),
  transition: theme.transitions.create('margin', {
    easing: theme.transitions.easing.sharp,
    duration: theme.transitions.duration.leavingScreen,
  }),
  marginLeft: `-${drawerWidth}px`,
  ...(open && {
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.easeOut,
      duration: theme.transitions.duration.enteringScreen,
    }),
    marginLeft: 0,
  }),
}));

const Layout = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [open, setOpen] = useState(!isMobile);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const navigate = useNavigate();
  const location = useLocation();

  const handleDrawerToggle = () => {
    setOpen(!open);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  const handleMenuClick = (item: { text: string; path: string; subItems?: any[] }) => {
    if (item.subItems) {
      setExpandedMenu(expandedMenu === item.text ? null : item.text);
    } else {
      navigate(item.path);
      if (isMobile) handleDrawerClose();
    }
  };

  return (
    <Box sx={{ display: 'flex' }}>
      <CssBaseline />
      
      <Header onMenuClick={handleDrawerToggle} />
      
      <StyledDrawer
        variant={isMobile ? 'temporary' : 'permanent'}
        open={open}
        onClose={handleDrawerClose}
        ModalProps={{ keepMounted: true }}
      >
        <DrawerHeader>
          <IconButton onClick={handleDrawerClose}>
            {theme.direction === 'rtl' ? <ChevronRightIcon /> : <ChevronLeftIcon />}
          </IconButton>
        </DrawerHeader>
        
        <Divider />
        
        <List>
          {menuItems.map((item) => (
            <React.Fragment key={item.text}>
              <ListItem disablePadding sx={{ display: 'block' }}>
                <ListItemButton
                  sx={{
                    minHeight: 48,
                    justifyContent: open ? 'initial' : 'center',
                    px: 2.5,
                    position: 'relative',
                    bgcolor: location.pathname === item.path || 
                            (item.path !== '/' && location.pathname.startsWith(item.path + '/')) ? 
                            'rgba(41, 121, 255, 0.2)' : 'transparent',
                    borderLeft: location.pathname === item.path || 
                               (item.path !== '/' && location.pathname.startsWith(item.path + '/')) ? 
                               `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
                    transition: theme.transitions.create(['background-color', 'border-color'], {
                      duration: theme.transitions.duration.shorter,
                    }),
                    '&:hover': {
                      bgcolor: 'action.hover',
                    },
                  }}
                  component={Link}
                  to={item.path}
                  onClick={() => handleMenuClick(item)}
                >
                  <ListItemIcon
                    sx={{
                      minWidth: 0,
                      mr: open ? 3 : 'auto',
                      justifyContent: 'center',
                      color: location.pathname === item.path || 
                             (item.path !== '/' && location.pathname.startsWith(item.path + '/')) ? 
                             'primary.main' : 'inherit',
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText 
                    primary={item.text} 
                    sx={{ 
                      opacity: open ? 1 : 0,
                      '& .MuiTypography-root': {
                        fontWeight: location.pathname === item.path || 
                                   (item.path !== '/' && location.pathname.startsWith(item.path + '/')) ? 
                                   'bold' : 'normal',
                      }
                    }} 
                  />
                  {item.subItems && open && (
                    expandedMenu === item.text ? <ExpandLessIcon /> : <ExpandMoreIcon />
                  )}
                </ListItemButton>
              </ListItem>

              {/* Submenu items */}
              {item.subItems && (
                <Collapse in={open && expandedMenu === item.text} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.subItems.map((subItem) => (
                      <ListItemButton
                        key={subItem.text}
                        sx={{ 
                          pl: 4,
                          position: 'relative',
                          bgcolor: location.pathname === subItem.path ? 'rgba(41, 121, 255, 0.2)' : 'transparent',
                          borderLeft: location.pathname === subItem.path ? 
                                     `4px solid ${theme.palette.primary.main}` : '4px solid transparent',
                          transition: theme.transitions.create(['background-color', 'border-color'], {
                            duration: theme.transitions.duration.shorter,
                          }),
                          '&:hover': {
                            bgcolor: 'action.hover',
                          },
                        }}
                        component={Link}
                        to={subItem.path}
                      >
                        <ListItemIcon
                          sx={{
                            color: location.pathname === subItem.path ? 'primary.main' : 'inherit',
                          }}
                        >
                          {subItem.icon}
                        </ListItemIcon>
                        <ListItemText 
                          primary={subItem.text} 
                          sx={{ 
                            '& .MuiTypography-root': {
                              fontWeight: location.pathname === subItem.path ? 'bold' : 'normal',
                            }
                          }} 
                          primaryTypographyProps={{ 
                            fontSize: '0.875rem' 
                          }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                </Collapse>
              )}
            </React.Fragment>
          ))}
        </List>
      </StyledDrawer>
      
      <MainContent open={open}>
        <DrawerHeader />
        <Container maxWidth="xl" sx={{ pt: 2, pb: 4 }}>
          <Breadcrumbs />
          <Outlet />
        </Container>
      </MainContent>
    </Box>
  );
};

export default Layout;
