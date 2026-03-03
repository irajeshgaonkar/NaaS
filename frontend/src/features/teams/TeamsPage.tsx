import { useMemo, useState } from 'react';
import { Box, Button, Stack, TextField } from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import { GridColDef } from '@mui/x-data-grid';
import { PageHeader } from '../../components/common/PageHeader';
import { EntityDataGrid } from '../../components/tables/EntityDataGrid';
import { StatusChip } from '../../components/common/StatusChip';
import { Team } from '../../services/models';
import { useTeamMutations, useTeams } from '../../hooks/useNaasQueries';
import { TeamFormDrawer } from '../../forms/TeamFormDrawer';
import { useAuthStore } from '../../store/authStore';
import { RoleGuard } from '../../guards/RoleGuard';

export default function TeamsPage() {
  const role = useAuthStore((state) => state.user.role);
  const { data: teams } = useTeams();
  const { createTeam, updateTeam, deleteTeam } = useTeamMutations();

  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | undefined>();

  const canManageTeams = role === 'admin';

  const filteredTeams = useMemo(
    () =>
      (teams ?? []).filter(
        (team) =>
          team.name.toLowerCase().includes(query.toLowerCase()) ||
          team.description.toLowerCase().includes(query.toLowerCase()),
      ),
    [teams, query],
  );

  const columns: GridColDef[] = [
    { field: 'name', headerName: 'Team', flex: 1.2, minWidth: 180 },
    { field: 'description', headerName: 'Description', flex: 1.5, minWidth: 220 },
    {
      field: 'members',
      headerName: 'Members',
      minWidth: 110,
      valueGetter: (params) => params.row.members.length,
    },
    {
      field: 'accessLevelEnabled',
      headerName: 'Access Level',
      minWidth: 130,
      renderCell: (params) =>
        params.row.accessLevelEnabled ? (
          <StatusChip label="Enabled" tone="success" />
        ) : (
          <StatusChip label="Disabled" tone="default" />
        ),
    },
    {
      field: 'updatedAt',
      headerName: 'Last Modified',
      minWidth: 170,
      valueFormatter: (params) => new Date(params.value as string).toLocaleDateString(),
    },
    {
      field: 'actions',
      headerName: 'Actions',
      minWidth: 180,
      sortable: false,
      renderCell: (params) => (
        <Stack direction="row" spacing={1}>
          <Button
            size="small"
            startIcon={<EditOutlinedIcon />}
            disabled={!canManageTeams}
            onClick={() => {
              setEditingTeam(params.row);
              setOpen(true);
            }}
          >
            Edit
          </Button>
          <Button
            size="small"
            color="error"
            startIcon={<DeleteOutlineIcon />}
            disabled={!canManageTeams}
            onClick={() => deleteTeam.mutate(params.row.id)}
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
        title="Teams"
        subtitle="Manage teams, onboard members, and configure access scopes"
        actions={
          <RoleGuard allowedRoles={['admin']} fallbackMessage="Only Notification Admin can create, edit, or delete teams.">
            <Button
              variant="contained"
              startIcon={<AddIcon />}
              onClick={() => {
                setEditingTeam(undefined);
                setOpen(true);
              }}
            >
              Create Team
            </Button>
          </RoleGuard>
        }
      />

      <Box sx={{ mb: 2, maxWidth: 420 }}>
        <TextField fullWidth label="Search teams" value={query} onChange={(event) => setQuery(event.target.value)} />
      </Box>

      <EntityDataGrid rows={filteredTeams} columns={columns} getRowId={(row) => row.id} />

      <TeamFormDrawer
        open={open}
        onClose={() => setOpen(false)}
        editingTeam={editingTeam}
        isSubmitting={createTeam.isPending || updateTeam.isPending}
        onSubmit={(payload) => {
          if ('id' in payload) {
            updateTeam.mutate(payload as Team);
          } else {
            createTeam.mutate(payload as Omit<Team, 'id' | 'createdAt' | 'updatedAt'>);
          }
          setOpen(false);
        }}
      />
    </>
  );
}
