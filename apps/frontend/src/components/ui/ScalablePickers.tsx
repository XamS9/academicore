import Autocomplete, {
  createFilterOptions,
} from "@mui/material/Autocomplete";
import TextField from "@mui/material/TextField";

export interface GroupPickerOption {
  id: string;
  groupCode: string;
  subject: { name: string; code?: string };
  academicPeriod?: { name: string; startDate?: string } | null;
}

const groupFilterOptions = createFilterOptions<GroupPickerOption>({
  limit: 100,
  stringify: (g) =>
    `${g.subject.name} ${g.subject.code ?? ""} ${g.groupCode} ${g.academicPeriod?.name ?? ""}`,
});

export function groupOptionLabel(g: GroupPickerOption): string {
  return `${g.subject.name} (${g.groupCode}) — ${g.academicPeriod?.name ?? "—"}`;
}

export function GroupAutocomplete({
  options,
  value,
  onChange,
  label = "Grupo",
  disabled,
  sx,
}: {
  options: GroupPickerOption[];
  value: string;
  onChange: (groupId: string) => void;
  label?: string;
  disabled?: boolean;
  sx?: object;
}) {
  const selected = options.find((g) => g.id === value) ?? null;
  return (
    <Autocomplete<GroupPickerOption, false, false, false>
      options={options}
      value={selected}
      onChange={(_, v) => onChange(v?.id ?? "")}
      getOptionLabel={(g) => groupOptionLabel(g)}
      filterOptions={groupFilterOptions}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      disabled={disabled}
      sx={sx}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder="Buscar por materia, código o período…"
          fullWidth
        />
      )}
      noOptionsText="Sin coincidencias — refine la búsqueda"
    />
  );
}

export interface PeriodPickerOption {
  id: string;
  name: string;
  isActive: boolean;
}

const periodFilterOptions = createFilterOptions<PeriodPickerOption>({
  limit: 50,
  stringify: (p) => p.name,
});

export function PeriodAutocomplete({
  options,
  value,
  onChange,
  label = "Período académico",
  disabled,
  sx,
}: {
  options: PeriodPickerOption[];
  value: string;
  onChange: (periodId: string) => void;
  label?: string;
  disabled?: boolean;
  sx?: object;
}) {
  const selected = options.find((p) => p.id === value) ?? null;
  return (
    <Autocomplete<PeriodPickerOption, false, false, false>
      options={options}
      value={selected}
      onChange={(_, v) => onChange(v?.id ?? "")}
      getOptionLabel={(p) => p.name}
      filterOptions={periodFilterOptions}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      disabled={disabled}
      sx={sx}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder="Buscar período…"
          fullWidth
        />
      )}
      noOptionsText="Sin coincidencias"
    />
  );
}

export interface StudentPickerOption {
  id: string;
  studentCode: string;
  user: { firstName: string; lastName: string };
}

const studentFilterOptions = createFilterOptions<StudentPickerOption>({
  limit: 100,
  stringify: (s) =>
    `${s.studentCode} ${s.user.firstName} ${s.user.lastName}`,
});

export function StudentAutocomplete({
  options,
  value,
  onChange,
  label = "Estudiante",
  disabled,
}: {
  options: StudentPickerOption[];
  value: string;
  onChange: (studentId: string) => void;
  label?: string;
  disabled?: boolean;
}) {
  const selected = options.find((s) => s.id === value) ?? null;
  return (
    <Autocomplete<StudentPickerOption, false, false, false>
      options={options}
      value={selected}
      onChange={(_, v) => onChange(v?.id ?? "")}
      getOptionLabel={(s) =>
        `${s.studentCode} — ${s.user.firstName} ${s.user.lastName}`
      }
      filterOptions={studentFilterOptions}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder="Buscar por código o nombre…"
          margin="dense"
          fullWidth
        />
      )}
      noOptionsText="Sin coincidencias — refine la búsqueda"
    />
  );
}

export interface CareerPickerOption {
  id: string;
  name: string;
}

const careerFilterOptions = createFilterOptions<CareerPickerOption>({
  limit: 80,
  stringify: (c) => c.name,
});

export function CareerAutocomplete({
  options,
  value,
  onChange,
  label = "Carrera",
  disabled,
}: {
  options: CareerPickerOption[];
  value: string;
  onChange: (careerId: string) => void;
  label?: string;
  disabled?: boolean;
}) {
  const selected = options.find((c) => c.id === value) ?? null;
  return (
    <Autocomplete<CareerPickerOption, false, false, false>
      options={options}
      value={selected}
      onChange={(_, v) => onChange(v?.id ?? "")}
      getOptionLabel={(c) => c.name}
      filterOptions={careerFilterOptions}
      isOptionEqualToValue={(a, b) => a.id === b.id}
      disabled={disabled}
      renderInput={(params) => (
        <TextField
          {...params}
          label={label}
          placeholder="Buscar carrera…"
          margin="dense"
          fullWidth
        />
      )}
      noOptionsText="Sin coincidencias"
    />
  );
}
