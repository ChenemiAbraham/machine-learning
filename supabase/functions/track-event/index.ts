import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface EventPayload {
  event_name: string;
  user_id?: string;
  anonymous_id?: string;
  session_id?: string;
  properties?: Record<string, any>;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  utm_content?: string;
  utm_term?: string;
  referrer?: string;
  device_id?: string;
  device_type?: string;
  device_os?: string;
  device_model?: string;
  app_version?: string;
  browser?: string;
  browser_version?: string;
  ip_address?: string;
  country?: string;
  city?: string;
  experiment_id?: string;
  experiment_variant?: string;
  client_timestamp?: string;
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

    const payload: EventPayload = await req.json();

    if (!payload.event_name) {
      return new Response(
        JSON.stringify({ error: 'event_name is required' }),
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

    const serverTimestamp = new Date().toISOString();

    const eventData = {
      event_name: payload.event_name,
      user_id: payload.user_id || null,
      anonymous_id: payload.anonymous_id || null,
      session_id: payload.session_id || null,
      properties: payload.properties || {},
      utm_source: payload.utm_source || null,
      utm_medium: payload.utm_medium || null,
      utm_campaign: payload.utm_campaign || null,
      utm_content: payload.utm_content || null,
      utm_term: payload.utm_term || null,
      referrer: payload.referrer || null,
      device_id: payload.device_id || null,
      device_type: payload.device_type || null,
      device_os: payload.device_os || null,
      device_model: payload.device_model || null,
      app_version: payload.app_version || null,
      browser: payload.browser || null,
      browser_version: payload.browser_version || null,
      ip_address: payload.ip_address || null,
      country: payload.country || null,
      city: payload.city || null,
      experiment_id: payload.experiment_id || null,
      experiment_variant: payload.experiment_variant || null,
      client_timestamp: payload.client_timestamp || null,
      server_timestamp: serverTimestamp,
      event_version: '1.0',
    };

    const { data: event, error: insertError } = await supabaseClient
      .from('events')
      .insert(eventData)
      .select()
      .single();

    if (insertError) {
      console.error('Error inserting event:', insertError);
      return new Response(
        JSON.stringify({ error: 'Failed to insert event', details: insertError }),
        {
          status: 500,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    await upsertSession(supabaseClient, eventData);

    if (payload.event_name === 'transaction_completed') {
      await supabaseClient.rpc('pgmq_send', {
        queue_name: 'ml_feature_refresh',
        message: JSON.stringify({
          user_id: payload.user_id,
          event_type: 'transaction_completed',
          timestamp: serverTimestamp,
        }),
      });
    }

    return new Response(
      JSON.stringify({
        success: true,
        event_id: event.id,
        timestamp: serverTimestamp,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error processing event:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});

async function upsertSession(supabaseClient: any, eventData: any) {
  if (!eventData.session_id) return;

  const { data: existingSession } = await supabaseClient
    .from('sessions')
    .select('*')
    .eq('session_id', eventData.session_id)
    .single();

  if (existingSession) {
    await supabaseClient
      .from('sessions')
      .update({
        last_event_at: eventData.server_timestamp,
        event_count: existingSession.event_count + 1,
        user_id: eventData.user_id || existingSession.user_id,
      })
      .eq('session_id', eventData.session_id);
  } else {
    await supabaseClient.from('sessions').insert({
      user_id: eventData.user_id || null,
      anonymous_id: eventData.anonymous_id || null,
      session_id: eventData.session_id,
      device_id: eventData.device_id,
      first_event_at: eventData.server_timestamp,
      last_event_at: eventData.server_timestamp,
      event_count: 1,
      utm_source: eventData.utm_source,
      utm_medium: eventData.utm_medium,
      utm_campaign: eventData.utm_campaign,
      utm_content: eventData.utm_content,
      utm_term: eventData.utm_term,
      referrer: eventData.referrer,
      device_type: eventData.device_type,
      device_os: eventData.device_os,
      browser: eventData.browser,
      country: eventData.country,
    });
  }
}
