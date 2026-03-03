import {
  Box,
  Button,
  Card,
  CardContent,
  Drawer,
  FormControlLabel,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  Switch,
  TextField,
  Typography,
} from '@mui/material';
import { useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Rule, Template, TriggerType } from '../services/models';
import { useAuthStore } from '../store/authStore';

const schema = z.object({
  name: z.string().min(2),
  templateId: z.string().min(1),
  triggerType: z.enum(['Manual', 'System', 'Digest', 'Event']),
  category: z.enum(['Critical', 'Warning', 'Info']),
  defaultSubscribeForTeams: z.boolean(),
  isActive: z.boolean(),
});

type RuleFormValues = z.infer<typeof schema>;

const steps = ['Basic Info', 'Template Selection', 'Trigger Config', 'Subscription Behavior', 'Review & Save'];

interface RuleWizardDrawerProps {
  open: boolean;
  templates: Template[];
  onClose: () => void;
  onSubmit: (payload: Omit<Rule, 'id' | 'updatedAt'>) => void;
  isSubmitting?: boolean;
}

export const RuleWizardDrawer = ({ open, templates, onClose, onSubmit, isSubmitting }: RuleWizardDrawerProps) => {
  const user = useAuthStore((state) => state.user);
  const [activeStep, setActiveStep] = useState(0);

  const { control, watch, handleSubmit } = useForm<RuleFormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: '',
      templateId: templates[0]?.id ?? '',
      triggerType: 'System',
      category: 'Info',
      defaultSubscribeForTeams: true,
      isActive: true,
    },
  });

  const values = watch();

  const next = () => setActiveStep((prev) => Math.min(prev + 1, steps.length - 1));
  const back = () => setActiveStep((prev) => Math.max(prev - 1, 0));

  const submitForm = (formValues: RuleFormValues) => {
    onSubmit({ ...formValues, createdBy: user.name });
    setActiveStep(0);
  };

  return (
    <Drawer anchor="right" open={open} onClose={onClose}>
      <Box sx={{ width: { xs: '100vw', sm: 600 }, p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>
          Create Rule
        </Typography>
        <Stepper activeStep={activeStep} sx={{ mb: 3 }}>
          {steps.map((step) => (
            <Step key={step}>
              <StepLabel>{step}</StepLabel>
            </Step>
          ))}
        </Stepper>

        <Card>
          <CardContent>
            <Stack spacing={2}>
              {(activeStep === 0 || activeStep === 4) && (
                <Controller control={control} name="name" render={({ field }) => <TextField {...field} label="Rule Name" fullWidth />} />
              )}

              {(activeStep === 1 || activeStep === 4) && (
                <Controller
                  control={control}
                  name="templateId"
                  render={({ field }) => (
                    <TextField {...field} select label="Associated Template" fullWidth>
                      {templates.map((template) => (
                        <MenuItem key={template.id} value={template.id}>
                          {template.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              )}

              {(activeStep === 2 || activeStep === 4) && (
                <Controller
                  control={control}
                  name="triggerType"
                  render={({ field }) => (
                    <TextField {...field} select label="Trigger Type" fullWidth>
                      {['Manual', 'System', 'Digest', 'Event'].map((triggerType) => (
                        <MenuItem key={triggerType} value={triggerType as TriggerType}>
                          {triggerType}
                        </MenuItem>
                      ))}
                    </TextField>
                  )}
                />
              )}

              {(activeStep === 3 || activeStep === 4) && (
                <>
                  <Controller
                    control={control}
                    name="category"
                    render={({ field }) => (
                      <TextField {...field} select label="Category" fullWidth>
                        {['Critical', 'Warning', 'Info'].map((category) => (
                          <MenuItem key={category} value={category}>
                            {category}
                          </MenuItem>
                        ))}
                      </TextField>
                    )}
                  />
                  <Controller
                    control={control}
                    name="defaultSubscribeForTeams"
                    render={({ field }) => (
                      <FormControlLabel
                        control={<Switch checked={field.value} onChange={(_, checked) => field.onChange(checked)} />}
                        label="Default Subscribe for Teams"
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
                </>
              )}

              {activeStep === 4 && (
                <Box sx={{ bgcolor: '#f8fafc', p: 2, borderRadius: 1, fontFamily: 'monospace', fontSize: 13 }}>
                  {JSON.stringify(values, null, 2)}
                </Box>
              )}
            </Stack>
          </CardContent>
        </Card>

        <Stack direction="row" justifyContent="space-between" sx={{ mt: 2 }}>
          <Button onClick={back} disabled={activeStep === 0}>
            Back
          </Button>
          <Stack direction="row" spacing={1}>
            <Button onClick={onClose}>Cancel</Button>
            {activeStep < steps.length - 1 ? (
              <Button variant="contained" onClick={next}>
                Next
              </Button>
            ) : (
              <Button variant="contained" onClick={handleSubmit(submitForm)} disabled={isSubmitting}>
                Save Rule
              </Button>
            )}
          </Stack>
        </Stack>
      </Box>
    </Drawer>
  );
};
