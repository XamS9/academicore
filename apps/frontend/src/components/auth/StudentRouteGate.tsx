import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import { Navigate } from "react-router-dom";
import { useAuth } from "../../store/auth.context";
import { useStudentNav } from "../../store/student-nav.context";

type Gate = "inscribir" | "inscription" | "content" | "grades";

/**
 * Redirects students when a route must be hidden (payment / enrollment phase).
 * Non-students render children unchanged.
 */
export default function StudentRouteGate({
  gate,
  children,
}: {
  gate: Gate;
  children: React.ReactNode;
}) {
  const { currentUser } = useAuth();
  const {
    loading,
    showInscribirMaterias,
    showMiInscripcion,
    showMiContenido,
    showMisCalificaciones,
  } = useStudentNav();

  if (currentUser?.role !== "STUDENT") {
    return <>{children}</>;
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (gate === "inscribir" && !showInscribirMaterias) {
    return <Navigate to="/dashboard" replace />;
  }
  if (gate === "inscription" && !showMiInscripcion) {
    return <Navigate to="/mis-pagos" replace />;
  }
  if (gate === "content" && !showMiContenido) {
    return <Navigate to="/mis-pagos" replace />;
  }
  if (gate === "grades" && !showMisCalificaciones) {
    return <Navigate to="/mis-pagos" replace />;
  }

  return <>{children}</>;
}
