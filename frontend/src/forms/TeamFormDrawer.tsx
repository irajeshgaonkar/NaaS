import {
  Box,
  Button,
  Drawer,
  FormControlLabel,
  IconButton,
  Stack,
  Switch,
  TextField,
  Typography,
  MenuItem,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import AddIcon from '@mui/icons-material/Add';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import { useEffect } from 'react';
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Team } from '../services/models';
import { useAuthStore } from '../store/authStore';

const memberSchema = z.object({
  name: z.string().min(1, 'Member name is required'),
  email: z.string().email('Valid email required'),
  role: z.enum(['Admin', 'Manager', 'User']),
});

const teamSchema = z.object({
  name: z.string().min(2, 'Team name is required'),
  description: z.string().min(4, 'Description is required'),
  accessLevelEnabled: z.boolean(),
  members: z.array(memberSchema).min(1, 'At least one member is required'),
});

type TeamFormValues = z.infer<typeof teamSchema>;

interface TeamFormDrawerProps {
  open: boolean;
  onClose: () => void;
  editingTeam?: Team;
  onSubmit: (payload: Omit<Team, 'id' | 'createdAt' | 'updatedAt'> | Team) => void;
  isSubmitting?: boolean;
}

const defaultValues: TeamFormValues = {
  name: '',
  description: '',
  accessLevelEnabled: true,
  members: [{ name: '', email: '', role: 'User' }],
};

export const TeamFormDrawer = ({ open, onClose, editingTeam, onSubmit, isSubmitting }: TeamFormDrawerProps) => {
  const currentUser = useAuthStore((state) => state.user);
  const {
    control,
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<TeamFormValues>({
    resolver: zodResolver(teamSchema),
    defaultValues,
  });

  const { fields, append, remove } = useFieldArray({ control, name: 'members' });

  useEffect(() => {
    if (editingTeam) {
      reset({
        name: editingTeam.name,
        description: editingTeam.description,
        accessLevelEnabled: editingTeam.accessLevelEnabled,
        members: editingTeam.members.map((member) => ({
          name: member.name,
          email: member.email,
          role: member.role,
        })),
      });
      return;
    }
    reset(defaultValues);
  }, [editingTeam, reset]);

  const submitForm = (values: TeamFormValues) => {
    const members = values.members.map((member, index) => ({
      ...member,
      id: editingTeam?.members[index]?.id ?? `member-${Math.random().toString(36).slice(2, 8)}`,
    }));

    if (editingTeam) {
      onSubmit({ ...editingTeam, ...values, members });
      return;
    }

    onSubmit({
      ...values,
      members,
      createdBy: currentUser.name,
    });
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: '100vw', sm: 520 }, p: 3 }}>
        <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h6">{editingTeam ? 'Edit Team' : 'Create Team'}</Typography>
          <IconButton onClick={onClose}>
            <CloseIcon />
          </IconButton>
        </Stack>

        <Stack component="form" spacing={2} onSubmit={handleSubmit(submitForm)}>
          <TextField
            label="Team Name"
            {...register('name')}
            error={!!errors.name}
            helperText={errors.name?.message}
          />
          <TextField
            label="Description"
            multiline
            minRows={2}
            {...register('description')}
            error={!!errors.description}
            helperText={errors.description?.message}
          />
          <FormControlLabel control={<Switch {...register('accessLevelEnabled')} />} label="Team-level access enabled" />

          <Stack spacing={1}>
            <Typography variant="subtitle2">Members</Typography>
            {fields.map((field, index) => (
              <Stack key={field.id} direction="row" spacing={1} alignItems="start">
                <TextField
                  label="Name"
                  fullWidth
                  {...register(`members.${index}.name`)}
                  error={!!errors.members?.[index]?.name}
                  helperText={errors.members?.[index]?.name?.message}
                />
                <TextField
                  label="Email"
                  fullWidth
                  {...register(`members.${index}.email`)}
                  error={!!errors.members?.[index]?.email}
                  helperText={errors.members?.[index]?.email?.message}
                />
                <TextField select label="Role" sx={{ minWidth: 120 }} {...register(`members.${index}.role`)}>
                  <MenuItem value="Admin">Admin</MenuItem>
                  <MenuItem value="Manager">Manager</MenuItem>
                  <MenuItem value="User">User</MenuItem>
                </TextField>
                <IconButton onClick={() => remove(index)} disabled={fields.length === 1}>
                  <DeleteOutlineIcon />
                </IconButton>
              </Stack>
            ))}
            <Button startIcon={<AddIcon />} onClick={() => append({ name: '', email: '', role: 'User' })}>
              Add Member
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} justifyContent="end" sx={{ mt: 2 }}>
            <Button onClick={onClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isSubmitting}>
              {editingTeam ? 'Save Changes' : 'Create Team'}
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
};
