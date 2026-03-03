import { GridColDef } from '@mui/x-data-grid';
import { PageHeader } from '../../components/common/PageHeader';
import { EntityDataGrid } from '../../components/tables/EntityDataGrid';
import { StatusChip } from '../../components/common/StatusChip';
import { useSystemAlerts } from '../../hooks/useNaasQueries';

const severityTone = {
  P1: 'error',
  P2: 'warning',
  P3: 'info',
} as const;

export default function SystemAlertsPage() {
  const { data } = useSystemAlerts();

  const columns: GridColDef[] = [
    { field: 'title', headerName: 'Alert', flex: 1, minWidth: 260 },
    {
      field: 'severity',
      headerName: 'Severity',
      minWidth: 120,
      renderCell: (params) => (
        <StatusChip
          label={params.row.severity}
          tone={severityTone[params.row.severity as keyof typeof severityTone]}
        />
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      minWidth: 140,
      renderCell: (params) => <StatusChip label={params.row.status} tone={params.row.status === 'Resolved' ? 'success' : 'warning'} />,
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      minWidth: 170,
      valueFormatter: (params) => new Date(params.value as string).toLocaleString(),
    },
  ];

  return (
    <>
      <PageHeader title="System Alerts" subtitle="Current platform-level notification infrastructure alerts" />
      <EntityDataGrid rows={data ?? []} columns={columns} getRowId={(row) => row.id} />
    </>
  );
}
