"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

function buildCompletionMessage(
  jobType: string,
  result?: Record<string, unknown> | null
): string {
  if (!result) return "Job completed";
  switch (jobType) {
    case "indexes-ai": {
      const domestic = (result.instruments_analyzed as number) ?? 0;
      const global = (result.global_instruments_analyzed as number) ?? 0;
      const aiLabel = result.ai_success ? "AI report ready" : "AI step failed";
      return `${domestic} domestic + ${global} global · ${aiLabel}`;
    }
    case "indexes": {
      const domestic = (result.instruments_analyzed as number) ?? 0;
      const global = (result.global_instruments_analyzed as number) ?? 0;
      return `${domestic} domestic + ${global} global instruments analyzed`;
    }
    case "screen": {
      const count = (result.tickers_screened as number) ?? 0;
      return `${count} tickers screened`;
    }
    case "download": {
      const count = (result.tickers_processed as number) ?? 0;
      return `${count} tickers downloaded`;
    }
    default:
      return "Job completed";
  }
}

export function useJobTrigger() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ jobType, tickers }: { jobType: string; tickers?: string }) =>
      api.triggerJob(jobType, tickers),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
    },
  });
}

export function useJobStatus(jobId: string | null) {
  return useQuery({
    queryKey: ["job-status", jobId],
    queryFn: () => api.jobStatus(jobId!),
    enabled: !!jobId,
    refetchInterval: (query) => {
      const status = query.state.data?.status;
      if (status === "completed" || status === "failed") return false;
      return 3000;
    },
    staleTime: 0,
  });
}

export function useJobWithPolling(jobType: string) {
  const [activeJobId, setActiveJobId] = useState<string | null>(null);
  const [completionMessage, setCompletionMessage] = useState<string | null>(null);
  const trigger = useJobTrigger();
  const status = useJobStatus(activeJobId);
  const queryClient = useQueryClient();
  const prevStatus = useRef<string | undefined>(undefined);

  useEffect(() => {
    const currentStatus = status.data?.status;
    if (prevStatus.current !== currentStatus && currentStatus === "completed") {
      const result = status.data?.result;

      // Always refresh sessions and the session report
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["session-report"] });

      if (jobType === "indexes" || jobType === "indexes-ai") {
        // Refresh global market data shown in overview and /markets
        queryClient.invalidateQueries({ queryKey: ["globalReport"] });
      } else {
        // screen / download / analyze affect stock-level data
        queryClient.invalidateQueries({ queryKey: ["batch-screen"] });
        queryClient.invalidateQueries({ queryKey: ["screen"] });
        queryClient.invalidateQueries({ queryKey: ["chart"] });
      }

      setCompletionMessage(buildCompletionMessage(jobType, result));
    }
    prevStatus.current = currentStatus;
  }, [status.data?.status, status.data?.result, queryClient, jobType]);

  const startJob = useCallback(
    (tickers?: string) => {
      setCompletionMessage(null);
      trigger.mutate(
        { jobType, tickers },
        {
          onSuccess: (data) => {
            setActiveJobId(data.job_id);
          },
        }
      );
    },
    [jobType, trigger]
  );

  const reset = useCallback(() => {
    setActiveJobId(null);
    setCompletionMessage(null);
  }, []);

  return { startJob, reset, trigger, status, activeJobId, completionMessage };
}
