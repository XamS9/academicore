import React from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Skeleton from '@mui/material/Skeleton';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';

export interface Column<T> {
  key: string;
  label: string;
  render?: (row: T) => React.ReactNode;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  loading?: boolean;
  getRowKey: (row: T) => string;
}

export function DataTable<T>({ columns, rows, loading, getRowKey }: DataTableProps<T>) {
  if (loading) {
    return (
      <Paper sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 1.5 }}>
          {[...Array(5)].map((_, i) => (
            <Skeleton key={i} variant="rounded" height={36} sx={{ borderRadius: 1 }} />
          ))}
        </Box>
      </Paper>
    );
  }

  return (
    <TableContainer component={Paper} sx={{ border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ backgroundColor: 'grey.50' }}>
            {columns.map((col) => (
              <TableCell key={col.key} sx={{ fontWeight: 600, whiteSpace: 'nowrap', color: 'text.secondary', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.04em', py: 1.5 }}>
                {col.label}
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columns.length} align="center" sx={{ py: 8 }}>
                <Typography variant="body2" color="text.secondary">
                  Sin datos
                </Typography>
              </TableCell>
            </TableRow>
          ) : (
            rows.map((row) => (
              <TableRow
                key={getRowKey(row)}
                sx={{
                  '&:hover': { backgroundColor: 'rgba(99,102,241,0.03)' },
                  transition: 'background-color 0.15s ease',
                }}
              >
                {columns.map((col) => (
                  <TableCell key={col.key} sx={{ py: 1.25 }}>
                    {col.render
                      ? col.render(row)
                      : String((row as Record<string, unknown>)[col.key] ?? '')}
                  </TableCell>
                ))}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}
