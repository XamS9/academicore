import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { enrollmentsService } from "../services/enrollments.service";
import { useAuth } from "./auth.context";

export interface StudentNavState {
  activePeriodId: string | null;
  enrollmentOpen: boolean;
  pendingInscriptionPayment: boolean;
  minStudentsToOpenGroup?: number;
  tuitionRequestPhaseActive?: boolean;
}

/** Student nav gates: `docs/processes.md` §28 (enrollment window, inscription payment, next period). */
interface StudentNavContextValue {
  loading: boolean;
  navState: StudentNavState | null;
  refresh: () => Promise<void>;
  /** Visible when inscription fee for active period is paid (or no pending inscription fee). */
  showMiInscripcion: boolean;
  showMiContenido: boolean;
  showMisCalificaciones: boolean;
  /** Visible when active period has enrollment open, or closed with tuition-request phase. */
  showInscribirMaterias: boolean;
}

const defaultValue: StudentNavContextValue = {
  loading: true,
  navState: null,
  refresh: async () => {},
  showMiInscripcion: false,
  showMiContenido: false,
  showMisCalificaciones: false,
  showInscribirMaterias: false,
};

const StudentNavContext = createContext<StudentNavContextValue>(defaultValue);

export function StudentNavProvider({ children }: { children: ReactNode }) {
  const { currentUser, isAuthenticated } = useAuth();
  const isStudent = currentUser?.role === "STUDENT";

  const [loading, setLoading] = useState(isStudent);
  const [navState, setNavState] = useState<StudentNavState | null>(null);

  const load = useCallback(async () => {
    if (!isStudent) {
      setNavState(null);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const data = await enrollmentsService.getMyNavState();
      setNavState(data as StudentNavState);
    } catch {
      setNavState({
        activePeriodId: null,
        enrollmentOpen: false,
        pendingInscriptionPayment: false,
        minStudentsToOpenGroup: 0,
        tuitionRequestPhaseActive: false,
      });
    } finally {
      setLoading(false);
    }
  }, [isStudent]);

  useEffect(() => {
    if (!isAuthenticated || !isStudent) {
      setNavState(null);
      setLoading(false);
      return;
    }
    void load();
  }, [isAuthenticated, isStudent, load]);

  const value = useMemo((): StudentNavContextValue => {
    const pending = navState?.pendingInscriptionPayment ?? false;
    const open = navState?.enrollmentOpen ?? false;
    const hasPeriod = Boolean(navState?.activePeriodId);
    const tuitionPhase = navState?.tuitionRequestPhaseActive ?? false;

    return {
      loading: isStudent && loading,
      navState,
      refresh: load,
      showMiInscripcion: !isStudent || (!loading && !pending),
      showMiContenido: !isStudent || (!loading && !pending),
      showMisCalificaciones: !isStudent || (!loading && !pending),
      showInscribirMaterias:
        !isStudent || (!loading && hasPeriod && (open || tuitionPhase)),
    };
  }, [isStudent, loading, navState, load]);

  return (
    <StudentNavContext.Provider value={value}>
      {children}
    </StudentNavContext.Provider>
  );
}

export function useStudentNav() {
  return useContext(StudentNavContext);
}
