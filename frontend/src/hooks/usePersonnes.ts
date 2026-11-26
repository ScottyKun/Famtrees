import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { personneService } from "../services/personneService";
import type { PersonnePayload } from "../types";

export const PERSONNES_KEY = ["personnes"] as const;

export function usePersonnes() {
  return useQuery({
    queryKey: PERSONNES_KEY,
    queryFn:  personneService.getAll,
  });
}

export function usePersonne(id: string) {
  return useQuery({
    queryKey: [...PERSONNES_KEY, id],
    queryFn:  () => personneService.getById(id),
    enabled:  !!id,
  });
}

export function useCreatePersonne() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PersonnePayload) => personneService.create(payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: PERSONNES_KEY }),
  });
}

export function useUpdatePersonne(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: PersonnePayload) => personneService.update(id, payload),
    onSuccess:  () => qc.invalidateQueries({ queryKey: PERSONNES_KEY }),
  });
}

export function useDeletePersonne() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => personneService.delete(id),
    onSuccess:  () => qc.invalidateQueries({ queryKey: PERSONNES_KEY }),
  });
}