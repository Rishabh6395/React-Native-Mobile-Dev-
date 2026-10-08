import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { API_URL } from '../../lib/api'; // Or standard fetch config
import { ReportPayload } from 'shared';

export interface AiReport {
  id: string;
  userId: string;
  type: 'DAILY' | 'WEEKLY' | 'MONTHLY';
  periodStart: string;
  periodEnd: string;
  payload: ReportPayload;
  model: string;
  createdAt: string;
}

export function useReports(type: 'DAILY' | 'WEEKLY' | 'MONTHLY', periodStart: string) {
  return useQuery({
    queryKey: ['reports', type, periodStart],
    queryFn: async () => {
      // Stub API request
      // const res = await fetch(`${API_URL}/v1/reports?type=${type}&periodStart=${periodStart}`);
      // return res.json();
      
      // Temporary mock response for UI development
      return []; 
    }
  });
}

export function useGenerateReport() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ type, periodStart, periodEnd }: { type: string, periodStart: string, periodEnd: string }) => {
      const res = await fetch(`http://10.0.2.2:3000/v1/reports/generate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, periodStart, periodEnd })
      });
      if (!res.ok) throw new Error('Failed to generate report');
      return res.json();
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['reports', variables.type] });
    }
  });
}
