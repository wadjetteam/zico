import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "./api";

export function useFrameworks() {
  return useQuery({ queryKey: ["frameworks"], queryFn: async () => (await api.get("/compliance/frameworks")).data });
}

export function useRequirements(params?: any) {
  return useQuery({ queryKey: ["requirements", params], queryFn: async () => (await api.get("/compliance/requirements", { params })).data });
}

export function useAssessments(params?: any) {
  return useQuery({ queryKey: ["assessments", params], queryFn: async () => (await api.get("/compliance/assessments", { params })).data });
}

export function useEvidence(params?: any) {
  return useQuery({ queryKey: ["evidence", params], queryFn: async () => (await api.get("/compliance/evidence", { params })).data });
}

export function useGaps(params?: any) {
  return useQuery({ queryKey: ["gaps", params], queryFn: async () => (await api.get("/compliance/gaps", { params })).data });
}

export function useRemediation(params?: any) {
  return useQuery({ queryKey: ["remediation", params], queryFn: async () => (await api.get("/compliance/remediation", { params })).data });
}

export function useFindings(params?: any) {
  return useQuery({ queryKey: ["findings", params], queryFn: async () => (await api.get("/compliance/findings", { params })).data });
}

export function useDashboard() {
  return useQuery({ queryKey: ["dashboard"], queryFn: async () => (await api.get("/compliance/dashboard")).data });
}

export function useReference() {
  return useQuery({ queryKey: ["reference"], queryFn: async () => {
    const [controls, risks, policies, assets, audits] = await Promise.all([
      api.get("/compliance/reference/controls"), api.get("/compliance/reference/risks"),
      api.get("/compliance/reference/policies"), api.get("/compliance/reference/assets"), api.get("/compliance/reference/audits"),
    ]);
    return { controls: controls.data.items, risks: risks.data.items, policies: policies.data.items, assets: assets.data.items, audits: audits.data.items };
  }});
}

export function useCreateFramework() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => api.post("/compliance/frameworks", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["frameworks"] }) });
}

export function useCreateRequirement() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => api.post("/compliance/requirements", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["requirements"] }) });
}

export function useCreateGap() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => api.post("/compliance/gaps", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["gaps"] }) });
}

export function useCreateRemediation() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (data: any) => api.post("/compliance/remediation", data), onSuccess: () => qc.invalidateQueries({ queryKey: ["remediation"] }) });
}
