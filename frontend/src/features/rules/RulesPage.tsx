import { useMemo, useState } from 'react';
import { Box, Button, Chip, Stack } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { GridColDef } from '@mui/x-data-grid';
import { PageHeader } from '../../components/common/PageHeader';
import { EntityDataGrid } from '../../components/tables/EntityDataGrid';
import { StatusChip } from '../../components/common/StatusChip';
import { Rule } from '../../services/models';
import { useAuthStore } from '../../store/authStore';
import { useRuleMutations, useRules, useTemplates } from '../../hooks/useNaasQueries';
import { RuleWizardDrawer } from '../../forms/RuleWizardDrawer';

export default function RulesPage() {
  const role = useAuthStore((state) => state.user.role);
  const canEdit = role === 'manager';

  const { data: rules } = useRules();
  const { data: templates } = useTemplates();
  const { deleteRule, updateRule, createRule } = useRuleMutations();

  const [wizardOpen, setWizardOpen] = useState(false);

  const templateLookup = useMemo(
    () => Object.fromEntries((templates ?? []).map((template) => [template.id, template.name])),
    [templates],
  );

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Rule Name', flex: 1, minWidth: 180 },
    {
      field: 'templateId',
      headerName: 'Associated Template',
      flex: 1,
      minWidth: 180,
      valueGetter: (params) => templateLookup[params.row.templateId] ?? params.row.templateId,
    },
    {
      field: 'triggerType',
      headerName: 'Trigger Type',
      minWidth: 120,
    },
    {
      field: 'category',
      headerName: 'Category',
      minWidth: 130,
      renderCell: (params) => <Chip size="small" label={params.row.category} />,
    },
    {
      field: 'defaultSubscribeForTeams',
      headerName: 'Default Subscribe',
      minWidth: 150,
      renderCell: (params) =>
        params.row.defaultSubscribeForTeams ? (
          <StatusChip label="Enabled" tone="success" />
        ) : (
          <StatusChip label="Disabled" tone="default" />
        ),
    },
    {
      field: 'isActive',
      headerName: 'Status',
      minWidth: 120,
      renderCell: (params) =>
        params.row.isActive ? <StatusChip label="Active" tone="success" /> : <StatusChip label="Inactive" tone="warning" />,
    },
    {
      field: 'actions',
      headerName: 'Actions',
      minWidth: 240,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            disabled={!canEdit}
            onClick={() => updateRule.mutate({ ...params.row, isActive: !params.row.isActive } as Rule)}
          >
            Toggle Active
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteOutlineIcon />}
            disabled={!canEdit}
            onClick={() => deleteRule.mutate(params.row.id)}
          >
            Delete
          </Button>
        </Stack>
      ),
    },
  ];

  return (
    <>
      <PageHeader
        title="Rules"
        subtitle="Create and manage notification rules, triggers, and default subscription behavior"
        actions={
          <Button variant="contained" startIcon={<AddIcon />} onClick={() => setWizardOpen(true)} disabled={!canEdit}>
            New Rule
          </Button>
        }
      />

      <EntityDataGrid rows={rules ?? []} columns={columns} getRowId={(row) => row.id} />

      <RuleWizardDrawer
        open={wizardOpen}
        templates={templates ?? []}
        isSubmitting={createRule.isPending}
        onClose={() => setWizardOpen(false)}
        onSubmit={(payload) => {
          createRule.mutate(payload);
          setWizardOpen(false);
        }}
      />

      {!canEdit && <Box sx={{ mt: 2 }}><StatusChip label="Read-only for Notification User/Admin" tone="info" /></Box>}
    </>
  );
}
