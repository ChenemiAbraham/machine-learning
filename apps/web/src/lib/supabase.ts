import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'http://localhost:54321';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export async function fetchUsers() {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(1000);

  if (error) throw error;
  return data || [];
}

export async function fetchEvents() {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10000);

  if (error) throw error;
  return data || [];
}

export async function fetchTransactions() {
  const { data, error } = await supabase
    .from('transactions')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(5000);

  if (error) throw error;
  return data || [];
}

export async function fetchExperiments() {
  const { data, error } = await supabase
    .from('experiments')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

export async function fetchExperimentAssignments(experimentId: string) {
  const { data, error } = await supabase
    .from('experiment_assignments')
    .select('*')
    .eq('experiment_id', experimentId);

  if (error) throw error;
  return data || [];
}

export async function fetchReconciliationReports() {
  const { data, error } = await supabase
    .from('reconciliation_reports')
    .select('*')
    .order('report_date', { ascending: false })
    .limit(30);

  if (error) throw error;
  return data || [];
}

export async function fetchSessions() {
  const { data, error } = await supabase
    .from('sessions')
    .select('*')
    .order('first_event_at', { ascending: false })
    .limit(1000);

  if (error) throw error;
  return data || [];
}
