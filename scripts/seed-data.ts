#!/usr/bin/env tsx

import { createClient } from '@supabase/supabase-js';
import { faker } from '@faker-js/faker';

const SUPABASE_URL = process.env.SUPABASE_URL || 'http://localhost:54321';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || '';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

const UTM_SOURCES = ['google', 'facebook', 'twitter', 'instagram', 'linkedin', 'direct', 'referral'];
const UTM_MEDIUMS = ['cpc', 'social', 'email', 'organic', 'referral'];
const UTM_CAMPAIGNS = ['summer-promo', 'welcome-bonus', 'friend-referral', 'brand-awareness'];
const COUNTRIES = ['NG', 'GH', 'KE', 'ZA', 'UG', 'TZ', 'RW'];
const DEVICE_TYPES = ['mobile', 'desktop', 'tablet'];
const DEVICE_OS = ['iOS', 'Android', 'Windows', 'macOS'];

const EVENT_NAMES = [
  'page_view',
  'app_opened',
  'signup_started',
  'signup_completed',
  'kyc_started',
  'kyc_step_completed',
  'kyc_completed',
  'kyc_failed',
  'transaction_initiated',
  'transaction_completed',
  'transaction_failed',
];

interface UserProfile {
  id: string;
  email: string;
  phone: string;
  first_name: string;
  last_name: string;
  country_code: string;
  kyc_status: string;
  signup_source: string;
  signup_utm_source: string;
  signup_utm_medium: string;
  signup_utm_campaign: string;
  device_id: string;
  device_type: string;
  device_os: string;
  created_at: Date;
}

async function main() {
  console.log('🚀 Starting Juicyway Growth Platform seed data generation...\n');

  console.log('📊 Generating seed data with:');
  console.log('  - 1,000 users');
  console.log('  - 50,000+ events');
  console.log('  - 5,000+ transactions');
  console.log('  - 3 active experiments');
  console.log('  - Realistic user journeys\n');

  await cleanDatabase();
  const users = await seedUsers(1000);
  await seedExperiments();
  await seedUserJourneys(users);
  await seedTransactions(users);
  await seedMLFeatures(users);
  await generateReconciliationReport();

  console.log('\n✅ Seed data generation complete!');
  console.log('\n📈 Summary:');
  const stats = await getStats();
  console.log(`  Users: ${stats.users}`);
  console.log(`  Events: ${stats.events}`);
  console.log(`  Transactions: ${stats.transactions}`);
  console.log(`  Sessions: ${stats.sessions}`);
  console.log(`  Experiments: ${stats.experiments}`);
  console.log(`  Experiment Assignments: ${stats.assignments}`);
}

async function cleanDatabase() {
  console.log('🧹 Cleaning existing data...');

  await supabase.from('ml_predictions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('ml_user_features').delete().neq('user_id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('reconciliation_reports').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('experiment_assignments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('experiments').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('events').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('sessions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  await supabase.from('users').delete().neq('id', '00000000-0000-0000-0000-000000000000');

  console.log('✓ Database cleaned\n');
}

async function seedUsers(count: number): Promise<UserProfile[]> {
  console.log(`👥 Creating ${count} users...`);

  const users: UserProfile[] = [];
  const batchSize = 100;

  for (let i = 0; i < count; i += batchSize) {
    const batch = [];
    const batchCount = Math.min(batchSize, count - i);

    for (let j = 0; j < batchCount; j++) {
      const countryCode = faker.helpers.arrayElement(COUNTRIES);
      const createdAt = faker.date.between({
        from: new Date('2024-01-01'),
        to: new Date('2024-06-19'),
      });

      const deviceType = faker.helpers.arrayElement(DEVICE_TYPES);
      const deviceOs = faker.helpers.arrayElement(DEVICE_OS);

      const kycStatuses = ['not_started', 'in_progress', 'completed', 'failed'];
      const weights = [0.15, 0.10, 0.70, 0.05];
      const kycStatus = faker.helpers.weightedArrayElement(
        kycStatuses.map((status, idx) => ({ weight: weights[idx], value: status }))
      );

      const user = {
        email: faker.internet.email().toLowerCase(),
        phone: faker.phone.number(),
        first_name: faker.person.firstName(),
        last_name: faker.person.lastName(),
        country_code: countryCode,
        kyc_status: kycStatus,
        kyc_completed_at: kycStatus === 'completed' ? faker.date.soon({ refDate: createdAt }) : null,
        signup_source: faker.helpers.arrayElement(['web', 'mobile', 'referral']),
        signup_utm_source: faker.helpers.arrayElement(UTM_SOURCES),
        signup_utm_medium: faker.helpers.arrayElement(UTM_MEDIUMS),
        signup_utm_campaign: faker.helpers.arrayElement(UTM_CAMPAIGNS),
        device_id: faker.string.uuid(),
        device_type: deviceType,
        device_os: deviceOs,
        app_version: '2.5.0',
        created_at: createdAt.toISOString(),
      };

      batch.push(user);
    }

    const { data, error } = await supabase.from('users').insert(batch).select();

    if (error) {
      console.error('Error inserting users:', error);
      throw error;
    }

    users.push(...(data as UserProfile[]));
    process.stdout.write(`  Progress: ${Math.min(i + batchSize, count)}/${count} users\r`);
  }

  console.log(`\n✓ Created ${users.length} users\n`);
  return users;
}

async function seedExperiments() {
  console.log('🧪 Creating experiments...');

  const experiments = [
    {
      name: 'onboarding_v2',
      description: 'Test new onboarding flow with gamification',
      hypothesis: 'Adding gamification will increase KYC completion rate by 15%',
      status: 'running',
      variants: [
        { name: 'control', weight: 0.5, description: 'Current onboarding flow' },
        { name: 'treatment', weight: 0.5, description: 'Gamified onboarding' },
      ],
      allocation_percent: 80,
      primary_metric: 'kyc_completion_rate',
      secondary_metrics: ['time_to_kyc', 'first_transaction_rate'],
      confidence_level: 0.95,
      minimum_detectable_effect: 0.05,
      start_date: new Date('2024-06-01').toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      name: 'transaction_fee_messaging',
      description: 'Test transparent fee messaging',
      hypothesis: 'Showing fee comparison will increase conversion by 10%',
      status: 'running',
      variants: [
        { name: 'control', weight: 0.5 },
        { name: 'fee_comparison', weight: 0.5 },
      ],
      allocation_percent: 100,
      primary_metric: 'transaction_completion_rate',
      secondary_metrics: ['transaction_drop_off_rate'],
      confidence_level: 0.95,
      minimum_detectable_effect: 0.03,
      start_date: new Date('2024-05-15').toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
    {
      name: 'referral_reward_amount',
      description: 'Test optimal referral reward amount',
      hypothesis: 'Higher rewards will increase referral conversions',
      status: 'running',
      variants: [
        { name: 'control_10', weight: 0.33, description: '$10 reward' },
        { name: 'treatment_20', weight: 0.33, description: '$20 reward' },
        { name: 'treatment_30', weight: 0.34, description: '$30 reward' },
      ],
      allocation_percent: 100,
      primary_metric: 'referral_conversion_rate',
      secondary_metrics: ['referrer_retention', 'referee_ltv'],
      confidence_level: 0.95,
      minimum_detectable_effect: 0.05,
      start_date: new Date('2024-06-10').toISOString(),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    },
  ];

  const { error } = await supabase.from('experiments').insert(experiments);

  if (error) {
    console.error('Error inserting experiments:', error);
    throw error;
  }

  console.log(`✓ Created ${experiments.length} experiments\n`);
}

async function seedUserJourneys(users: UserProfile[]) {
  console.log('🛣️  Generating user journeys (events & sessions)...');

  const batchSize = 50;

  for (let i = 0; i < users.length; i += batchSize) {
    const batch = users.slice(i, Math.min(i + batchSize, users.length));

    await Promise.all(batch.map(user => generateUserJourney(user)));

    process.stdout.write(`  Progress: ${Math.min(i + batchSize, users.length)}/${users.length} users\r`);
  }

  console.log(`\n✓ Generated user journeys\n`);
}

async function generateUserJourney(user: UserProfile) {
  const sessionId = faker.string.uuid();
  const sessionStart = new Date(user.created_at);

  const events: any[] = [];

  events.push({
    event_name: 'page_view',
    user_id: null,
    anonymous_id: user.device_id,
    session_id: sessionId,
    properties: { page_url: '/landing', page_title: 'Juicyway - Send Money to Africa' },
    utm_source: user.signup_utm_source,
    utm_medium: user.signup_utm_medium,
    utm_campaign: user.signup_utm_campaign,
    device_id: user.device_id,
    device_type: user.device_type,
    device_os: user.device_os,
    country: user.country_code,
    server_timestamp: sessionStart.toISOString(),
    created_at: sessionStart.toISOString(),
  });

  sessionStart.setMinutes(sessionStart.getMinutes() + faker.number.int({ min: 1, max: 5 }));

  events.push({
    event_name: 'signup_started',
    user_id: null,
    anonymous_id: user.device_id,
    session_id: sessionId,
    properties: { signup_method: 'email' },
    utm_source: user.signup_utm_source,
    utm_medium: user.signup_utm_medium,
    utm_campaign: user.signup_utm_campaign,
    device_id: user.device_id,
    device_type: user.device_type,
    device_os: user.device_os,
    country: user.country_code,
    server_timestamp: sessionStart.toISOString(),
    created_at: sessionStart.toISOString(),
  });

  sessionStart.setMinutes(sessionStart.getMinutes() + faker.number.int({ min: 2, max: 10 }));

  events.push({
    event_name: 'signup_completed',
    user_id: user.id,
    anonymous_id: user.device_id,
    session_id: sessionId,
    properties: { signup_method: 'email', email: user.email },
    utm_source: user.signup_utm_source,
    utm_medium: user.signup_utm_medium,
    utm_campaign: user.signup_utm_campaign,
    device_id: user.device_id,
    device_type: user.device_type,
    device_os: user.device_os,
    country: user.country_code,
    server_timestamp: sessionStart.toISOString(),
    created_at: sessionStart.toISOString(),
  });

  if (user.kyc_status !== 'not_started') {
    sessionStart.setMinutes(sessionStart.getMinutes() + faker.number.int({ min: 5, max: 30 }));

    events.push({
      event_name: 'kyc_started',
      user_id: user.id,
      session_id: sessionId,
      properties: { kyc_type: 'basic' },
      device_id: user.device_id,
      device_type: user.device_type,
      device_os: user.device_os,
      country: user.country_code,
      server_timestamp: sessionStart.toISOString(),
      created_at: sessionStart.toISOString(),
    });

    if (user.kyc_status === 'completed') {
      sessionStart.setMinutes(sessionStart.getMinutes() + faker.number.int({ min: 3, max: 15 }));

      events.push({
        event_name: 'kyc_completed',
        user_id: user.id,
        session_id: sessionId,
        properties: { completion_time_seconds: faker.number.int({ min: 180, max: 900 }) },
        device_id: user.device_id,
        device_type: user.device_type,
        device_os: user.device_os,
        country: user.country_code,
        server_timestamp: sessionStart.toISOString(),
        created_at: sessionStart.toISOString(),
      });
    }
  }

  const shouldHaveAppOpens = Math.random() > 0.3;
  if (shouldHaveAppOpens) {
    const appOpenCount = faker.number.int({ min: 1, max: 20 });
    for (let i = 0; i < appOpenCount; i++) {
      const openDate = faker.date.between({
        from: new Date(user.created_at),
        to: new Date(),
      });

      events.push({
        event_name: 'app_opened',
        user_id: user.id,
        session_id: faker.string.uuid(),
        properties: { is_first_open: i === 0 },
        device_id: user.device_id,
        device_type: user.device_type,
        device_os: user.device_os,
        country: user.country_code,
        server_timestamp: openDate.toISOString(),
        created_at: openDate.toISOString(),
      });
    }
  }

  await supabase.from('events').insert(events);
}

async function seedTransactions(users: UserProfile[]) {
  console.log('💸 Creating transactions...');

  const completedKycUsers = users.filter(u => u.kyc_status === 'completed');
  const transactionUsers = completedKycUsers.filter(() => Math.random() > 0.2);

  const transactions: any[] = [];

  for (const user of transactionUsers) {
    const txCount = faker.number.int({ min: 1, max: 15 });

    for (let i = 0; i < txCount; i++) {
      const createdDate = faker.date.between({
        from: user.kyc_completed_at || user.created_at,
        to: new Date(),
      });

      const status = faker.helpers.weightedArrayElement([
        { weight: 0.85, value: 'completed' },
        { weight: 0.05, value: 'failed' },
        { weight: 0.03, value: 'pending' },
        { weight: 0.07, value: 'processing' },
      ]);

      const amount = faker.number.float({ min: 10, max: 5000, fractionDigits: 2 });
      const fee = amount * 0.015;

      transactions.push({
        user_id: user.id,
        type: faker.helpers.arrayElement(['send', 'receive', 'conversion']),
        status,
        amount,
        currency: 'USD',
        fee,
        exchange_rate: faker.number.float({ min: 400, max: 450, fractionDigits: 4 }),
        recipient_name: faker.person.fullName(),
        reference: faker.string.alphanumeric(10).toUpperCase(),
        provider: 'juicyway',
        metadata: {},
        created_at: createdDate.toISOString(),
        updated_at: createdDate.toISOString(),
        completed_at: status === 'completed' ? createdDate.toISOString() : null,
        failed_at: status === 'failed' ? createdDate.toISOString() : null,
        failure_reason: status === 'failed' ? 'Insufficient funds' : null,
      });

      if (status === 'completed') {
        await supabase.from('events').insert({
          event_name: 'transaction_completed',
          user_id: user.id,
          session_id: faker.string.uuid(),
          properties: {
            transaction_type: transactions[transactions.length - 1].type,
            amount,
            currency: 'USD',
            is_first_transaction: i === 0,
          },
          device_id: user.device_id,
          device_type: user.device_type,
          device_os: user.device_os,
          country: user.country_code,
          server_timestamp: createdDate.toISOString(),
          created_at: createdDate.toISOString(),
        });
      }
    }
  }

  const batchSize = 500;
  for (let i = 0; i < transactions.length; i += batchSize) {
    const batch = transactions.slice(i, Math.min(i + batchSize, transactions.length));
    await supabase.from('transactions').insert(batch);
    process.stdout.write(`  Progress: ${Math.min(i + batchSize, transactions.length)}/${transactions.length} transactions\r`);
  }

  console.log(`\n✓ Created ${transactions.length} transactions\n`);
}

async function seedMLFeatures(users: UserProfile[]) {
  console.log('🤖 Generating ML features...');

  const features: any[] = [];

  for (const user of users) {
    const { data: userTransactions } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', user.id)
      .eq('status', 'completed');

    const { data: userEvents } = await supabase
      .from('events')
      .select('*')
      .eq('user_id', user.id)
      .eq('event_name', 'app_opened');

    const now = new Date();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const tx7d = (userTransactions || []).filter(
      (t: any) => new Date(t.created_at) >= sevenDaysAgo
    ).length;
    const tx30d = (userTransactions || []).filter(
      (t: any) => new Date(t.created_at) >= thirtyDaysAgo
    ).length;

    const appOpens7d = (userEvents || []).filter(
      (e: any) => new Date(e.created_at) >= sevenDaysAgo
    ).length;

    const lastTx = (userTransactions || []).sort(
      (a: any, b: any) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )[0];

    const daysSinceLastTx = lastTx
      ? Math.floor((now.getTime() - new Date(lastTx.created_at).getTime()) / (1000 * 60 * 60 * 24))
      : null;

    features.push({
      user_id: user.id,
      transaction_count_7d: tx7d,
      transaction_count_30d: tx30d,
      transaction_count_90d: (userTransactions || []).length,
      total_volume_30d: (userTransactions || [])
        .filter((t: any) => new Date(t.created_at) >= thirtyDaysAgo)
        .reduce((sum: number, t: any) => sum + parseFloat(t.amount), 0),
      app_open_count_7d: appOpens7d,
      days_since_last_transaction: daysSinceLastTx,
      churn_risk_score: daysSinceLastTx && daysSinceLastTx > 30 ? 0.7 : 0.2,
      fraud_risk_score: Math.random() > 0.95 ? 0.8 : 0.1,
      updated_at: new Date().toISOString(),
    });
  }

  const batchSize = 500;
  for (let i = 0; i < features.length; i += batchSize) {
    const batch = features.slice(i, Math.min(i + batchSize, features.length));
    await supabase.from('ml_user_features').insert(batch);
    process.stdout.write(`  Progress: ${Math.min(i + batchSize, features.length)}/${features.length} feature sets\r`);
  }

  console.log(`\n✓ Generated ${features.length} ML feature sets\n`);
}

async function generateReconciliationReport() {
  console.log('📊 Generating reconciliation report...');

  const today = new Date().toISOString().split('T')[0];

  const { count: txCount } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true })
    .eq('status', 'completed');

  const { count: eventCount } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true })
    .eq('event_name', 'transaction_completed');

  const discrepancy = Math.abs((txCount || 0) - (eventCount || 0));
  const discrepancyPercent = txCount ? (discrepancy / txCount) * 100 : 0;

  const status = discrepancyPercent < 1 ? 'healthy' : discrepancyPercent < 5 ? 'warning' : 'critical';

  await supabase.from('reconciliation_reports').insert({
    report_date: today,
    entity_type: 'transactions',
    source_count: txCount || 0,
    target_count: eventCount || 0,
    discrepancy_count: discrepancy,
    discrepancy_percentage: discrepancyPercent,
    status,
    alerts: discrepancyPercent > 1 ? [{ message: 'Transaction event mismatch detected' }] : [],
    created_at: new Date().toISOString(),
  });

  console.log(`✓ Generated reconciliation report (${status})\n`);
}

async function getStats() {
  const { count: users } = await supabase
    .from('users')
    .select('*', { count: 'exact', head: true });

  const { count: events } = await supabase
    .from('events')
    .select('*', { count: 'exact', head: true });

  const { count: transactions } = await supabase
    .from('transactions')
    .select('*', { count: 'exact', head: true });

  const { count: sessions } = await supabase
    .from('sessions')
    .select('*', { count: 'exact', head: true });

  const { count: experiments } = await supabase
    .from('experiments')
    .select('*', { count: 'exact', head: true });

  const { count: assignments } = await supabase
    .from('experiment_assignments')
    .select('*', { count: 'exact', head: true });

  return {
    users: users || 0,
    events: events || 0,
    transactions: transactions || 0,
    sessions: sessions || 0,
    experiments: experiments || 0,
    assignments: assignments || 0,
  };
}

main().catch(console.error);
