import { useState } from "react";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import useMediaQuery from "@mui/material/useMediaQuery";
import { useTheme } from "@mui/material/styles";
import { Outlet } from "react-router-dom";
import TopBar from "./TopBar";
import Sidebar, { DRAWER_WIDTH } from "./Sidebar";

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [desktopOpen, setDesktopOpen] = useState(true);
  const theme = useTheme();
  const isLg = useMediaQuery(theme.breakpoints.up("lg"));

  const handleToggleSidebar = () => {
    if (isLg) {
      setDesktopOpen((prev) => !prev);
    } else {
      setMobileOpen((prev) => !prev);
    }
  };

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <TopBar onToggleSidebar={handleToggleSidebar} />

      {/* Persistent sidebar on large screens */}
      {isLg && (
        <Sidebar
          open={desktopOpen}
          onClose={() => setDesktopOpen(false)}
          variant="permanent"
        />
      )}

      {/* Temporary sidebar on small screens */}
      {!isLg && (
        <Sidebar
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          variant="temporary"
        />
      )}

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          ml: isLg && desktopOpen ? `${DRAWER_WIDTH}px` : 0,
          transition: theme.transitions.create("margin-left", {
            easing: desktopOpen
              ? theme.transitions.easing.easeOut
              : theme.transitions.easing.sharp,
            duration: desktopOpen
              ? theme.transitions.duration.enteringScreen
              : theme.transitions.duration.leavingScreen,
          }),
          minHeight: "100vh",
          backgroundColor: "background.default",
        }}
      >
        <Toolbar />
        <Box sx={{ p: 3 }}>
          <Outlet />
        </Box>
      </Box>
    </Box>
  );
}
