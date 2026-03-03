import { useMemo, useState } from 'react';
import { Button } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import { GridColDef } from '@mui/x-data-grid';
import { PageHeader } from '../../components/common/PageHeader';
import { EntityDataGrid } from '../../components/tables/EntityDataGrid';
import { StatusChip } from '../../components/common/StatusChip';
import { useSubscriptionMutations, useSubscriptions, useRules, useTeams } from '../../hooks/useNaasQueries';
import { SubscriptionFormDrawer } from '../../forms/SubscriptionFormDrawer';
import { useAuthStore } from '../../store/authStore';

export default function SubscriptionsPage() {
  const role = useAuthStore((state) => state.user.role);
  const canEdit = role === 'manager';

  const { data: subscriptions } = useSubscriptions();
  const { data: teams } = useTeams();
  const { data: rules } = useRules();
  const { createSubscription } = useSubscriptionMutations();

  const [open, setOpen] = useState(false);

  const teamLookup = useMemo(() => Object.fromEntries((teams ?? []).map((team) => [team.id, team.name])), [teams]);
  const ruleLookup = useMemo(() => Object.fromEntries((rules ?? []).map((rule) => [rule.id, rule.name])), [rules]);

  const columns: GridColDef[] = [
    { field: 'scope', headerName: 'Scope', minWidth: 120 },
    {
      field: 'scopeId',
      headerName: 'Target',
      minWidth: 180,
      valueGetter: (params) => (params.row.scope === 'Team' ? teamLookup[params.row.scopeId] ?? params.row.scopeId : params.row.scopeId),
    },
    {
      field: 'ruleId',
      headerName: 'Rule',
      minWidth: 180,
      valueGetter: (params) => ruleLookup[params.row.ruleId] ?? params.row.ruleId,
    },
    {
      field: 'emails',
      headerName: 'Email List',
      flex: 1,
      minWidth: 220,
      valueGetter: (params) => params.row.emails.join(', '),
    },
    {
      field: 'groupedEmails',
      headerName: 'Delivery Mode',
      minWidth: 150,
      valueGetter: (params) => (params.row.groupedEmails ? 'Grouped' : 'Individual'),
    },
    {
      field: 'isActive',
      headerName: 'Status',
      minWidth: 120,
      renderCell: (params) => (params.row.isActive ? <StatusChip label="Active" tone="success" /> : <StatusChip label="Inactive" tone="warning" />),
    },
  ];

  return (
    <>
      <PageHeader
        title="Subscriptions"
        subtitle="Configure team and user subscriptions for targeted notification delivery"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setOpen(true)} disabled={!canEdit}>
            New Subscription
          </Button>
        }
      />
      <EntityDataGrid rows={subscriptions ?? []} columns={columns} getRowId={(row) => row.id} />

      <SubscriptionFormDrawer
        open={open}
        onClose={() => setOpen(false)}
        teams={teams ?? []}
        rules={rules ?? []}
        isSubmitting={createSubscription.isPending}
        onSubmit={(payload) => createSubscription.mutate(payload)}
      />
    </>
  );
}
