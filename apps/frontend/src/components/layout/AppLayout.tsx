import { useState } from "react";
import Box from "@mui/material/Box";
import Toolbar from "@mui/material/Toolbar";
import { Outlet } from "react-router-dom";
import TopBar from "./TopBar";
import Sidebar, { DRAWER_WIDTH } from "./Sidebar";

export default function AppLayout() {
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <Sidebar
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
      />

      <Box
        component="div"
        sx={{
          display: "flex",
          flexDirection: "column",
          flexGrow: 1,
          minHeight: "100vh",
          ml: { lg: `${DRAWER_WIDTH}px` },
        }}
      >
        <TopBar onMobileMenuToggle={() => setMobileOpen((prev) => !prev)} />
        <Box
          component="main"
          sx={{
            flexGrow: 1,
            backgroundColor: "background.default",
          }}
        >
          <Toolbar />
          <Box sx={{ p: 3 }}>
            <Outlet />
          </Box>
        </Box>
      </Box>
    </Box>
  );
}
