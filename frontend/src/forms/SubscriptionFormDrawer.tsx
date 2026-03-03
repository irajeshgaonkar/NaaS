import {
  Box,
  Button,
  Drawer,
  FormControlLabel,
  MenuItem,
  Stack,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Rule, Subscription, Team } from '../services/models';

const schema = z.object({
  scope: z.enum(['User', 'Team']),
  scopeId: z.string().min(1),
  ruleId: z.string().min(1),
  emails: z.string().min(1),
  groupedEmails: z.boolean(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface SubscriptionFormDrawerProps {
  open: boolean;
  onClose: () => void;
  teams: Team[];
  rules: Rule[];
  onSubmit: (payload: Omit<Subscription, 'id' | 'createdAt'>) => void;
  isSubmitting?: boolean;
}

export const SubscriptionFormDrawer = ({ open, onClose, teams, rules, onSubmit, isSubmitting }: SubscriptionFormDrawerProps) => {
  const { control, handleSubmit, watch } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      scope: 'Team',
      scopeId: teams[0]?.id ?? '',
      ruleId: rules[0]?.id ?? '',
      emails: '',
      groupedEmails: true,
      isActive: true,
    },
  });

  const scope = watch('scope');

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: '100vw', sm: 420 }, p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Create Subscription
        </Typography>
        <Stack spacing={2}>
          <Controller
            control={control}
            name="scope"
            render={({ field }) => (
              <TextField {...field} select label="Scope" fullWidth>
                <MenuItem value="User">User-based</MenuItem>
                <MenuItem value="Team">Team-based</MenuItem>
              </TextField>
            )}
          />
          <Controller
            control={control}
            name="scopeId"
            render={({ field }) => (
              <TextField {...field} select label={scope === 'Team' ? 'Team' : 'User ID'} fullWidth>
                {scope === 'Team'
                  ? teams.map((team) => (
                      <MenuItem key={team.id} value={team.id}>
                        {team.name}
                      </MenuItem>
                    ))
                  : teams.flatMap((team) =>
                      team.members.map((member) => (
                        <MenuItem key={member.id} value={member.id}>
                          {member.name}
                        </MenuItem>
                      )),
                    )}
              </TextField>
            )}
          />
          <Controller
            control={control}
            name="ruleId"
            render={({ field }) => (
              <TextField {...field} select label="Rule" fullWidth>
                {rules.map((rule) => (
                  <MenuItem key={rule.id} value={rule.id}>
                    {rule.name}
                  </MenuItem>
                ))}
              </TextField>
            )}
          />
          <Controller
            control={control}
            name="emails"
            render={({ field }) => (
              <TextField
                {...field}
                label="Email List (comma-separated)"
                multiline
                minRows={2}
                fullWidth
              />
            )}
          />
          <Controller
            control={control}
            name="groupedEmails"
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} />}
                label="Individual vs grouped emails"
              />
            )}
          />
          <Controller
            control={control}
            name="isActive"
            render={({ field }) => (
              <FormControlLabel
                control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} />}
                label="Active"
              />
            )}
          />
          <Stack direction="row" justifyContent="end" spacing={1}>
            <Button onClick={onClose}>Cancel</Button>
            <Button
              variant="contained"
              disabled={isSubmitting}
              onClick={handleSubmit((values) => {
                onSubmit({
                  scope: values.scope,
                  scopeId: values.scopeId,
                  ruleId: values.ruleId,
                  emails: values.emails.split(',').map((email) => email.trim()).filter(Boolean),
                  groupedEmails: values.groupedEmails,
                  isActive: values.isActive,
                });
                onClose();
              })}
            >
              Save
            </Button>
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
};
