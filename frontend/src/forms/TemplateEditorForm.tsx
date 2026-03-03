import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  FormControlLabel,
  Grid,
  Stack,
  Switch,
  Tab,
  Tabs,
  TextField,
  Typography,
} from '@mui/material';
import { useMemo, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Template } from '../services/models';
import { validatePlaceholders } from '../services/mockApi';

const templateSchema = z.object({
  name: z.string().min(2),
  emailTemplate: z.string().min(1),
  teamsTemplate: z.string().min(1),
  adaptiveCardJson: z.string().min(2),
  workflowJson: z.string().min(2),
  isActive: z.boolean(),
  isTeamsAdaptiveCard: z.boolean(),
  useApprovalWorkflow: z.boolean(),
});

type TemplateFormValues = z.infer<typeof templateSchema>;

interface TemplateEditorFormProps {
  template: Template;
  canEdit: boolean;
  onSave: (updatedTemplate: Template) => void;
  isSaving?: boolean;
}

const tabConfig = [
  { label: 'Email Template', key: 'emailTemplate' },
  { label: 'Teams Template', key: 'teamsTemplate' },
  { label: 'Adaptive Card JSON', key: 'adaptiveCardJson' },
  { label: 'Actionable Workflow JSON', key: 'workflowJson' },
] as const;

export const TemplateEditorForm = ({ template, canEdit, onSave, isSaving }: TemplateEditorFormProps) => {
  const [activeTab, setActiveTab] = useState(0);

  const { control, handleSubmit, watch } = useForm<TemplateFormValues>({
    resolver: zodResolver(templateSchema),
    values: {
      name: template.name,
      emailTemplate: template.emailTemplate,
      teamsTemplate: template.teamsTemplate,
      adaptiveCardJson: template.adaptiveCardJson,
      workflowJson: template.workflowJson,
      isActive: template.isActive,
      isTeamsAdaptiveCard: template.isTeamsAdaptiveCard,
      useApprovalWorkflow: template.useApprovalWorkflow,
    },
  });

  const watched = watch();
  const activeContent = watched[tabConfig[activeTab].key];

  const placeholderValidation = useMemo(() => validatePlaceholders(watched.emailTemplate, template.placeholders), [watched.emailTemplate, template.placeholders]);

  const submitForm = (values: TemplateFormValues) => {
    onSave({
      ...template,
      ...values,
      updatedAt: new Date().toISOString(),
    });
  };

  return (
    <Stack spacing={2}>
      <Card>
        <CardContent>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={2} alignItems={{ md: 'center' }}>
            <Controller
              control={control}
              name="name"
              render={({ field }) => <TextField {...field} fullWidth label="Template Name" disabled={!canEdit} />}
            />
            <Controller
              control={control}
              name="isActive"
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} disabled={!canEdit} />}
                  label="Active"
                />
              )}
            />
            <Controller
              control={control}
              name="isTeamsAdaptiveCard"
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} disabled={!canEdit} />}
                  label="Is Teams Adaptive Card?"
                />
              )}
            />
            <Controller
              control={control}
              name="useApprovalWorkflow"
              render={({ field }) => (
                <FormControlLabel
                  control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} disabled={!canEdit} />}
                  label="Use Approval Workflow?"
                />
              )}
            />
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <Tabs value={activeTab} onChange={(_, value) => setActiveTab(value)} variant="scrollable">
          {tabConfig.map((tab) => (
            <Tab key={tab.key} label={tab.label} />
          ))}
        </Tabs>
      </Card>

      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Editor
              </Typography>
              <Controller
                control={control}
                name={tabConfig[activeTab].key}
                render={({ field }) => (
                  <TextField
                    {...field}
                    multiline
                    minRows={16}
                    fullWidth
                    disabled={!canEdit}
                    placeholder="Type template content"
                  />
                )}
              />
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Live Preview
              </Typography>
              <Box sx={{ bgcolor: '#f8fafc', borderRadius: 1, p: 2, minHeight: 280, whiteSpace: 'pre-wrap', fontFamily: 'monospace' }}>
                {activeContent}
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Alert severity={placeholderValidation.invalid.length ? 'warning' : 'success'}>
        Placeholder validation: {placeholderValidation.invalid.length ? `Invalid placeholders: ${placeholderValidation.invalid.join(', ')}` : 'All placeholders are valid.'}
      </Alert>

      <Stack direction="row" justifyContent="end">
        <Button variant="contained" onClick={handleSubmit(submitForm)} disabled={!canEdit || isSaving}>
          Save Template
        </Button>
      </Stack>
    </Stack>
  );
};
