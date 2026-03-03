import { GridColDef } from '@mui/x-data-grid';
import { PageHeader } from '../../components/common/PageHeader';
import { EntityDataGrid } from '../../components/tables/EntityDataGrid';
import { useAuditLogs } from '../../hooks/useNaasQueries';

export default function AuditLogsPage() {
  const { data } = useAuditLogs();

  const columns: GridColDef[] = [
    { field: 'actor', headerName: 'Actor', minWidth: 180 },
    { field: 'action', headerName: 'Action', minWidth: 180 },
    { field: 'resourceType', headerName: 'Resource Type', minWidth: 140 },
    { field: 'resourceName', headerName: 'Resource', flex: 1, minWidth: 180 },
    {
      field: 'timestamp',
      headerName: 'Timestamp',
      minWidth: 190,
      valueFormatter: (params) => new Date(params.value as string).toLocaleString(),
    },
  ];

  return (
    <>
      <PageHeader title="Audit Logs" subtitle="Track create, update, and delete operations across notification artifacts" />
      <EntityDataGrid rows={data ?? []} columns={columns} getRowId={(row) => row.id} />
    </>
  );
}
