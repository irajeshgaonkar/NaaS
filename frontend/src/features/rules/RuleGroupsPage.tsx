import { GridColDef } from '@mui/x-data-grid';
import { PageHeader } from '../../components/common/PageHeader';
import { EntityDataGrid } from '../../components/tables/EntityDataGrid';
import { useRuleGroups } from '../../hooks/useNaasQueries';

export default function RuleGroupsPage() {
  const { data } = useRuleGroups();

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Rule Group', flex: 1, minWidth: 180 },
    { field: 'description', headerName: 'Description', flex: 1.5, minWidth: 240 },
    {
      field: 'ruleIds',
      headerName: 'Rules',
      minWidth: 110,
      valueGetter: (params) => params.row.ruleIds.length,
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      minWidth: 130,
      valueFormatter: (params) => new Date(params.value as string).toLocaleDateString(),
    },
  ];

  return (
    <>
      <PageHeader title="Rule Groups" subtitle="Logical groupings for reusable notification policies" />
      <EntityDataGrid rows={data ?? []} columns={columns} getRowId={(row) => row.id} />
    </>
  );
}
