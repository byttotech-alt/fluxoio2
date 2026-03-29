import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuthStore } from '@/store/authStore';
import type { PlanTier } from '@/types/database';

export interface PlanLimits {
  leads: number;
  proposals: number;
  contacts: number;
  products: number;
  tasks: number;
  team_members: number;
  wiki_docs: number;
}

// Limites para cada plano
const PLAN_LIMITS: Record<PlanTier, PlanLimits> = {
  free: {
    leads: 20,
    proposals: 10,
    contacts: 50,
    products: 30,
    tasks: 25,
    team_members: 3,
    wiki_docs: 10,
  },
  pro: {
    leads: 500,
    proposals: 200,
    contacts: 2000,
    products: 500,
    tasks: 1000,
    team_members: 20,
    wiki_docs: 100,
  },
  enterprise: {
    leads: 999999,
    proposals: 999999,
    contacts: 999999,
    products: 999999,
    tasks: 999999,
    team_members: 999999,
    wiki_docs: 999999,
  },
};

export interface PlanUsage {
  leads: number;
  proposals: number;
  contacts: number;
  products: number;
  tasks: number;
  team_members: number;
  wiki_docs: number;
}

export function usePlanLimits() {
  const { user, profile } = useAuthStore();
  const [usage, setUsage] = useState<PlanUsage>({
    leads: 0,
    proposals: 0,
    contacts: 0,
    products: 0,
    tasks: 0,
    team_members: 0,
    wiki_docs: 0,
  });
  const [loading, setLoading] = useState(true);

  const plan: PlanTier = profile?.plan || 'free';
  const limits = PLAN_LIMITS[plan];

  useEffect(() => {
    if (!user) return;
    fetchUsage();
  }, [user]);

  async function fetchUsage() {
    if (!user) return;
    try {
      const [leads, proposals, contacts, products, tasks, members, docs] = await Promise.all([
        supabase.from('leads').select('*', { count: 'exact', head: true }).eq('profile_id', user.id),
        supabase.from('proposals').select('*', { count: 'exact', head: true }).eq('profile_id', user.id),
        supabase.from('contacts').select('*', { count: 'exact', head: true }).eq('profile_id', user.id),
        supabase.from('products').select('*', { count: 'exact', head: true }).eq('profile_id', user.id),
        supabase.from('tasks').select('*', { count: 'exact', head: true }).eq('profile_id', user.id),
        supabase.from('team_members').select('*', { count: 'exact', head: true }).eq('profile_id', user.id),
        supabase.from('wiki_documents').select('*', { count: 'exact', head: true }).eq('profile_id', user.id),
      ]);

      setUsage({
        leads: leads.count || 0,
        proposals: proposals.count || 0,
        contacts: contacts.count || 0,
        products: products.count || 0,
        tasks: tasks.count || 0,
        team_members: members.count || 0,
        wiki_docs: docs.count || 0,
      });
    } catch (err) {
      console.error('Error fetching plan usage:', err);
    } finally {
      setLoading(false);
    }
  }

  // Calcula o percentual total de uso (média ponderada dos recursos mais usados)
  const totalUsed = Object.keys(usage).reduce((sum, key) => {
    const k = key as keyof PlanUsage;
    return sum + usage[k];
  }, 0);

  const totalLimit = Object.keys(limits).reduce((sum, key) => {
    const k = key as keyof PlanLimits;
    return sum + limits[k];
  }, 0);

  const overallPercent = totalLimit > 0 ? Math.min(100, Math.round((totalUsed / totalLimit) * 100)) : 0;

  // Verifica se QUALQUER recurso individual atingiu 100%
  const isBlocked = Object.keys(usage).some(key => {
    const k = key as keyof PlanUsage;
    return usage[k] >= limits[k];
  });

  // Retorna qual recurso está bloqueado
  const blockedResources = Object.keys(usage).filter(key => {
    const k = key as keyof PlanUsage;
    return usage[k] >= limits[k];
  });

  // Verifica se pode criar mais de um recurso específico
  function canCreate(resource: keyof PlanLimits): boolean {
    return usage[resource] < limits[resource];
  }

  function getResourceUsage(resource: keyof PlanLimits) {
    return {
      used: usage[resource],
      limit: limits[resource],
      percent: Math.min(100, Math.round((usage[resource] / limits[resource]) * 100)),
      blocked: usage[resource] >= limits[resource],
    };
  }

  return {
    plan,
    limits,
    usage,
    loading,
    overallPercent,
    isBlocked,
    blockedResources,
    canCreate,
    getResourceUsage,
    refetch: fetchUsage,
  };
}
