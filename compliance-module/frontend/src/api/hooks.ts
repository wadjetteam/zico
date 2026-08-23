import { useQuery } from "@tanstack/react-query";
import { api } from "../api/client";

export function useFrameworks() {
  return useQuery({ queryKey: ["frameworks"], queryFn: async () => (await api.get("/frameworks")).data });
}

export function useRequirements(params?: any) {
  return useQuery({ queryKey: ["requirements", params], queryFn: async () => (await api.get("/requirements", { params })).data });
}

export function useAssessments(params?: any) {
  return useQuery({ queryKey: ["assessments", params], queryFn: async () => (await api.get("/assessments", { params })).data });
}

export function useEvidence(params?: any) {
  return useQuery({ queryKey: ["evidence", params], queryFn: async () => (await api.get("/evidence", { params })).data });
}

export function useGaps(params?: any) {
  return useQuery({ queryKey: ["gaps", params], queryFn: async () => (await api.get("/gaps", { params })).data });
}

export function useRemediation(params?: any) {
  return useQuery({ queryKey: ["remediation", params], queryFn: async () => (await api.get("/remediation", { params })).data });
}

export function useFindings(params?: any) {
  return useQuery({ queryKey: ["findings", params], queryFn: async () => (await api.get("/findings", { params })).data });
}

export function useDashboard() {
  return useQuery({ queryKey: ["dashboard"], queryFn: async () => (await api.get("/dashboard")).data });
}

export function useReference() {
  return useQuery({ queryKey: ["reference"], queryFn: async () => {
    const [controls, risks, policies, assets, audits] = await Promise.all([
      api.get("/reference/controls"),
      api.get("/reference/risks"),
      api.get("/reference/policies"),
      api.get("/reference/assets"),
      api.get("/reference/audits"),
    ]);
    return { controls: controls.data.items, risks: risks.data.items, policies: policies.data.items, assets: assets.data.items, audits: audits.data.items };
  }});
}
