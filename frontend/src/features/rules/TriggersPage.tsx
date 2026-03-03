import { GridColDef } from '@mui/x-data-grid';
import { PageHeader } from '../../components/common/PageHeader';
import { EntityDataGrid } from '../../components/tables/EntityDataGrid';
import { StatusChip } from '../../components/common/StatusChip';
import { useTriggers } from '../../hooks/useNaasQueries';

export default function TriggersPage() {
  const { data } = useTriggers();

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Trigger', flex: 1, minWidth: 180 },
    { field: 'type', headerName: 'Type', minWidth: 120 },
    { field: 'source', headerName: 'Source', minWidth: 160 },
    {
      field: 'isEnabled',
      headerName: 'Status',
      minWidth: 120,
      renderCell: (params) => (params.row.isEnabled ? <StatusChip label="Enabled" tone="success" /> : <StatusChip label="Disabled" />),
    },
    {
      field: 'lastFiredAt',
      headerName: 'Last Fired',
      minWidth: 180,
      valueFormatter: (params) => new Date(params.value as string).toLocaleString(),
    },
  ];

  return (
    <>
      <PageHeader title="Triggers" subtitle="Inspect trigger sources for system, event, manual, and digest notifications" />
      <EntityDataGrid rows={data ?? []} columns={columns} getRowId={(row) => row.id} />
    </>
  );
}
