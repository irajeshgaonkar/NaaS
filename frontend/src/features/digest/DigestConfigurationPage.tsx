import { PageHeader } from '../../components/common/PageHeader';
import { DigestConfigForm } from '../../forms/DigestConfigForm';
import { useDigestConfig, useDigestMutations } from '../../hooks/useNaasQueries';
import { useAuthStore } from '../../store/authStore';

export default function DigestConfigurationPage() {
  const role = useAuthStore((state) => state.user.role);
  const canEdit = role === 'manager';
  const { data } = useDigestConfig();
  const { updateDigestConfig } = useDigestMutations();

  if (!data) return null;

  return (
    <>
      <PageHeader title="Digest Configuration" subtitle="Set cadence and summary behavior for notification digests" />
      <DigestConfigForm
        config={data}
        canEdit={canEdit}
        isSaving={updateDigestConfig.isPending}
        onSave={(config) => updateDigestConfig.mutate(config)}
      />
    </>
  );
}
