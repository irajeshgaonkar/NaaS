import { naasApi as mockNaasApi } from './mockApi';
import { backendNaasApi } from './backendApi';
import { runtimeConfig } from './apiClient';

export const naasApi = runtimeConfig.useBackend ? backendNaasApi : mockNaasApi;
