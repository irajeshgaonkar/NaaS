import { useMemo, useState } from 'react';
import { Card, CardContent, Grid, List, ListItemButton, ListItemText, Typography } from '@mui/material';
import { PageHeader } from '../../components/common/PageHeader';
import { useTemplateMutations, useTemplates } from '../../hooks/useNaasQueries';
import { TemplateEditorForm } from '../../forms/TemplateEditorForm';
import { useAuthStore } from '../../store/authStore';

export default function TemplatesPage() {
  const role = useAuthStore((state) => state.user.role);
  const canEdit = role === 'manager';

  const { data: templates } = useTemplates();
  const { updateTemplate } = useTemplateMutations();

  const selectedTemplate = useMemo(
    () => templates?.[0],
    [templates],
  );
  const [selectedId, setSelectedId] = useState<string | undefined>(selectedTemplate?.id);

  const activeTemplate = useMemo(
    () => templates?.find((template) => template.id === selectedId) ?? templates?.[0],
    [templates, selectedId],
  );

  return (
    <>
      <PageHeader
        title="Templates"
        subtitle="Manage email, Teams, Adaptive Card, and actionable workflow templates"
      />

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <Card>
            <CardContent>
              <Typography variant="subtitle2" sx={{ mb: 1 }}>
                Templates
              </Typography>
              <List>
                {(templates ?? []).map((template) => (
                  <ListItemButton
                    key={template.id}
                    selected={template.id === activeTemplate?.id}
                    onClick={() => setSelectedId(template.id)}
                  >
                    <ListItemText
                      primary={template.name}
                      secondary={`Created by ${template.createdBy}`}
                    />
                  </ListItemButton>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={9}>
          {activeTemplate && (
            <TemplateEditorForm
              template={activeTemplate}
              canEdit={canEdit}
              isSaving={updateTemplate.isPending}
              onSave={(template) => updateTemplate.mutate(template)}
            />
          )}
        </Grid>
      </Grid>
    </>
  );
}
