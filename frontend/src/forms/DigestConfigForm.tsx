import { Button, Card, CardContent, FormControlLabel, MenuItem, Stack, Switch, TextField, Typography } from '@mui/material';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { DigestConfig } from '../services/models';

const schema = z.object({
  frequency: z.enum(['Daily', 'Weekly']),
  summaryEnabled: z.boolean(),
  includeFailures: z.boolean(),
  includeUsageMetrics: z.boolean(),
});

type FormValues = z.infer<typeof schema>;

interface DigestConfigFormProps {
  config: DigestConfig;
  onSave: (config: DigestConfig) => void;
  isSaving?: boolean;
  canEdit: boolean;
}

export const DigestConfigForm = ({ config, onSave, isSaving, canEdit }: DigestConfigFormProps) => {
  const { control, watch, handleSubmit } = useForm<FormValues>({
    resolver: zodResolver(schema),
    values: config,
  });

  const values = watch();

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Typography variant="subtitle1" sx={{ mb: 2 }}>
            Digest Configuration
          </Typography>
          <Stack spacing={1.5}>
            <Controller
              control={control}
              name="frequency"
              render={({ field }) => (
                <TextField {...field} select label="Frequency" sx={{ maxWidth: 240 }} disabled={!canEdit}>
                  <MenuItem value="Daily">Daily</MenuItem>
                  <MenuItem value="Weekly">Weekly</MenuItem>
                </TextField>
              )}
            />
            <Controller
              control={control}
              name="summaryEnabled"
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} disabled={!canEdit} />}
                  label="Summary enabled"
                />
              )}
            />
            <Controller
              control={control}
              name="includeFailures"
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} disabled={!canEdit} />}
                  label="Include failed notifications"
                />
              )}
            />
            <Controller
              control={control}
              name="includeUsageMetrics"
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} disabled={!canEdit} />}
                  label="Include usage metrics"
                />
              )}
            />
          </Stack>
          <Button sx={{ mt: 2 }} variant="contained" onClick={handleSubmit(onSave)} disabled={!canEdit || isSaving}>
            Save Configuration
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>
            Preview digest layout
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Frequency: {values.frequency} | Summary: {values.summaryEnabled ? 'Enabled' : 'Disabled'} | Failures: {values.includeFailures ? 'Included' : 'Hidden'} | Usage Metrics: {values.includeUsageMetrics ? 'Included' : 'Hidden'}
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
};
