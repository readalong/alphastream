"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api-client";

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

  // On job completion, refresh current data instead of navigating to a new session
  useEffect(() => {
    const currentStatus = status.data?.status;
    if (prevStatus.current !== currentStatus && currentStatus === "completed") {
      queryClient.invalidateQueries({ queryKey: ["sessions"] });
      queryClient.invalidateQueries({ queryKey: ["batch-screen"] });
      queryClient.invalidateQueries({ queryKey: ["screen"] });
      queryClient.invalidateQueries({ queryKey: ["chart"] });
      queryClient.invalidateQueries({ queryKey: ["session-report"] });
      setCompletionMessage("Results updated for today's session");
    }
    prevStatus.current = currentStatus;
  }, [status.data?.status, queryClient]);

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
