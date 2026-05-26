import { useQuery } from '@tanstack/react-query';

import { apiClient } from '@/lib/api-client';

const DOWNLOAD_URL_STALE_MS = 4 * 60 * 1000;

export function useDocumentDownloadUrlQuery(documentId: string, enabled: boolean) {
  return useQuery({
    queryKey: ['documents', 'download-url', documentId],
    queryFn: async () => {
      const res = await apiClient.get<{ success: boolean; data: { downloadUrl: string } }>(
        `/api/v1/documents/${encodeURIComponent(documentId)}/download-url`,
      );
      return res.data.data.downloadUrl;
    },
    enabled: enabled && documentId.length > 0,
    staleTime: DOWNLOAD_URL_STALE_MS,
  });
}
