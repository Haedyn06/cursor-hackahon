"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { JobStatus } from "@/lib/constants";
import * as jobsClient from "@/lib/client/jobs-client";
import type { CreateJobInput, Job, UpdateJobInput } from "@/lib/types/job";

type JobsContextValue = {
  jobs: Job[];
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  createJob: (input: CreateJobInput) => Promise<Job>;
  updateJob: (id: string, input: UpdateJobInput) => Promise<Job>;
  updateJobStatus: (id: string, status: JobStatus) => Promise<Job>;
  deleteJob: (id: string) => Promise<void>;
  deleteJobs: (ids: string[]) => Promise<void>;
};

const JobsContext = createContext<JobsContextValue | null>(null);

export function JobsProvider({ children }: { children: ReactNode }) {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const next = await jobsClient.fetchJobs();
      setJobs(next);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load jobs.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createJob = useCallback(async (input: CreateJobInput) => {
    const job = await jobsClient.createJob(input);
    setJobs((prev) => [job, ...prev]);
    return job;
  }, []);

  const updateJob = useCallback(async (id: string, input: UpdateJobInput) => {
    const job = await jobsClient.updateJob(id, input);
    setJobs((prev) => prev.map((item) => (item.id === id ? job : item)));
    return job;
  }, []);

  const updateJobStatus = useCallback(async (id: string, status: JobStatus) => {
    const job = await jobsClient.updateJobStatus(id, status);
    setJobs((prev) => prev.map((item) => (item.id === id ? job : item)));
    return job;
  }, []);

  const deleteJob = useCallback(async (id: string) => {
    await jobsClient.deleteJob(id);
    setJobs((prev) => prev.filter((item) => item.id !== id));
  }, []);

  const deleteJobs = useCallback(async (ids: string[]) => {
    if (ids.length === 0) return;
    if (ids.length === 1) {
      await jobsClient.deleteJob(ids[0]);
    } else {
      await jobsClient.deleteJobs(ids);
    }
    const idSet = new Set(ids);
    setJobs((prev) => prev.filter((item) => !idSet.has(item.id)));
  }, []);

  const value = useMemo(
    () => ({
      jobs,
      loading,
      error,
      refresh,
      createJob,
      updateJob,
      updateJobStatus,
      deleteJob,
      deleteJobs,
    }),
    [
      jobs,
      loading,
      error,
      refresh,
      createJob,
      updateJob,
      updateJobStatus,
      deleteJob,
      deleteJobs,
    ],
  );

  return (
    <JobsContext.Provider value={value}>{children}</JobsContext.Provider>
  );
}

export function useJobs() {
  const ctx = useContext(JobsContext);
  if (!ctx) {
    throw new Error("useJobs must be used within JobsProvider");
  }
  return ctx;
}
