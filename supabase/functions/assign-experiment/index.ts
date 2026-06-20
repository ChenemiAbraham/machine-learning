import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface AssignmentRequest {
  experiment_name: string;
  user_id?: string;
  anonymous_id?: string;
  force_variant?: string;
}

interface ExperimentVariant {
  name: string;
  weight: number;
  description?: string;
}

interface Experiment {
  id: string;
  name: string;
  status: string;
  variants: ExperimentVariant[];
  allocation_percent: number;
  target_audience?: Record<string, any>;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const payload: AssignmentRequest = await req.json();

    if (!payload.experiment_name) {
      return new Response(
        JSON.stringify({ error: 'experiment_name is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (!payload.user_id && !payload.anonymous_id) {
      return new Response(
        JSON.stringify({ error: 'Either user_id or anonymous_id is required' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { data: experiment, error: expError } = await supabaseClient
      .from('experiments')
      .select('*')
      .eq('name', payload.experiment_name)
      .eq('status', 'running')
      .single();

    if (expError || !experiment) {
      return new Response(
        JSON.stringify({
          error: 'Experiment not found or not running',
          in_experiment: false,
        }),
        {
          status: 404,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const experimentData = experiment as Experiment;
    const identifier = payload.user_id || payload.anonymous_id!;

    const { data: existingAssignment } = await supabaseClient
      .from('experiment_assignments')
      .select('*')
      .eq('experiment_id', experimentData.id)
      .or(
        payload.user_id
          ? `user_id.eq.${payload.user_id}`
          : `anonymous_id.eq.${payload.anonymous_id}`
      )
      .single();

    if (existingAssignment) {
      return new Response(
        JSON.stringify({
          experiment_id: experimentData.id,
          experiment_name: experimentData.name,
          variant: existingAssignment.variant,
          in_experiment: true,
          is_new_assignment: false,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    if (payload.force_variant) {
      const validVariant = experimentData.variants.find(
        (v: ExperimentVariant) => v.name === payload.force_variant
      );
      if (!validVariant) {
        return new Response(
          JSON.stringify({ error: 'Invalid variant specified' }),
          {
            status: 400,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          }
        );
      }

      const assignmentHash = await generateHash(experimentData.id, identifier);

      await supabaseClient.from('experiment_assignments').insert({
        experiment_id: experimentData.id,
        user_id: payload.user_id || null,
        anonymous_id: payload.anonymous_id || null,
        variant: payload.force_variant,
        assignment_hash: assignmentHash,
      });

      return new Response(
        JSON.stringify({
          experiment_id: experimentData.id,
          experiment_name: experimentData.name,
          variant: payload.force_variant,
          in_experiment: true,
          is_new_assignment: true,
          forced: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const allocationHash = hashString(`${experimentData.id}:${identifier}:allocation`);
    const allocationValue = hashToPercent(allocationHash);

    if (allocationValue > experimentData.allocation_percent) {
      return new Response(
        JSON.stringify({
          experiment_id: experimentData.id,
          experiment_name: experimentData.name,
          in_experiment: false,
          reason: 'Not allocated to experiment',
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const assignedVariant = selectVariant(
      experimentData.variants,
      identifier,
      experimentData.id
    );

    const assignmentHash = await generateHash(experimentData.id, identifier);

    await supabaseClient.from('experiment_assignments').insert({
      experiment_id: experimentData.id,
      user_id: payload.user_id || null,
      anonymous_id: payload.anonymous_id || null,
      variant: assignedVariant,
      assignment_hash: assignmentHash,
    });

    return new Response(
      JSON.stringify({
        experiment_id: experimentData.id,
        experiment_name: experimentData.name,
        variant: assignedVariant,
        in_experiment: true,
        is_new_assignment: true,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error assigning experiment:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

function hashString(input: string): number {
  let hash = 0;
  for (let i = 0; i < input.length; i++) {
    const char = input.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function hashToPercent(hash: number): number {
  return (hash % 100) + 1;
}

function selectVariant(
  variants: ExperimentVariant[],
  identifier: string,
  experimentId: string
): string {
  const hash = hashString(`${experimentId}:${identifier}:variant`);
  const normalizedHash = (hash % 10000) / 100;

  let cumulativeWeight = 0;
  for (const variant of variants) {
    cumulativeWeight += variant.weight * 100;
    if (normalizedHash <= cumulativeWeight) {
      return variant.name;
    }
  }

  return variants[variants.length - 1].name;
}

async function generateHash(experimentId: string, identifier: string): Promise<string> {
  const input = `${experimentId}:${identifier}:${new Date().toISOString()}`;
  const encoder = new TextEncoder();
  const data = encoder.encode(input);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}
