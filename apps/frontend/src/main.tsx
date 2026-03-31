import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { CssBaseline, ThemeProvider, createTheme } from "@mui/material";
import App from "./App";
import "./index.css";

const theme = createTheme({
  palette: {
    mode: "light",
    primary: { main: "#4f46e5" }, // Indigo-600
    secondary: { main: "#7c3aed" }, // Violet-600
    background: {
      default: "#f8fafc", // Slate-50
      paper: "#ffffff",
    },
    error: { main: "#ef4444" },
    warning: { main: "#f59e0b" },
    success: { main: "#10b981" },
    info: { main: "#3b82f6" },
    divider: "rgba(0,0,0,0.06)",
    grey: {
      50: "#f8fafc", // Slate-50  — align with background.default
      100: "#f1f5f9", // Slate-100
      200: "#e2e8f0", // Slate-200
      300: "#cbd5e1", // Slate-300
      400: "#94a3b8", // Slate-400
      500: "#64748b", // Slate-500
      600: "#475569", // Slate-600
      700: "#334155", // Slate-700
      800: "#1e293b", // Slate-800
      900: "#0f172a", // Slate-900
    },
  },
  typography: {
    fontFamily:
      '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 800, letterSpacing: "-0.02em" },
    h5: { fontWeight: 700, letterSpacing: "-0.01em" },
    h6: { fontWeight: 700, letterSpacing: "-0.01em" },
    subtitle1: { fontWeight: 600 },
    body2: { fontSize: "0.875rem", lineHeight: 1.6 },
    button: { textTransform: "none", fontWeight: 600 },
  },
  shape: {
    borderRadius: 12,
  },
  shadows: [
    "none",
    "0 1px 2px rgba(0,0,0,0.04)", // 1
    "0 1px 3px rgba(0,0,0,0.06), 0 1px 2px rgba(0,0,0,0.04)", // 2
    "0 4px 6px -1px rgba(0,0,0,0.06), 0 2px 4px rgba(0,0,0,0.04)", // 3
    "0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.04)", // 4
    ...Array(20).fill(
      "0 10px 15px -3px rgba(0,0,0,0.06), 0 4px 6px rgba(0,0,0,0.04)",
    ),
  ] as unknown as typeof createTheme extends (o: infer T) => unknown
    ? T extends { shadows: infer S }
      ? S
      : never
    : never,
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: "8px 20px",
          boxShadow: "none",
          "&:hover": { boxShadow: "none" },
        },
        sizeSmall: {
          padding: "5px 14px",
          fontSize: "0.8125rem",
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
          border: "1px solid rgba(0,0,0,0.06)",
        },
        elevation0: {
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "none",
        },
        elevation1: {
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 2px rgba(0,0,0,0.04)",
        },
        elevation2: {
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
        },
        elevation3: {
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 2px 6px rgba(0,0,0,0.06)",
        },
        elevation4: {
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        },
      },
      defaultProps: {
        elevation: 0,
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          border: "1px solid rgba(0,0,0,0.06)",
          boxShadow: "0 1px 3px rgba(0,0,0,0.04)",
          "&:hover": {
            boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
          },
          transition: "box-shadow 0.2s ease",
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 600,
          borderRadius: 8,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderBottom: "1px solid rgba(0,0,0,0.05)",
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundImage: "none",
        },
      },
    },
    MuiSkeleton: {
      styleOverrides: {
        root: {
          backgroundColor: "rgba(0,0,0,0.04)",
        },
      },
    },
    MuiTableContainer: {
      styleOverrides: {
        root: {
          borderRadius: 12,
          overflow: "hidden",
        },
      },
    },
  },
});

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
);
