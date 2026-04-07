/**
 * DOWNGRADE API — Cancels the user's Stripe subscription and downgrades to free.
 *
 * FLOW:
 * 1. Find the user's Stripe customer by email
 * 2. Cancel all active subscriptions in Stripe
 * 3. Update the user's profile to 'free' in Supabase
 * 4. Send a downgrade notification email via our Gmail SMTP
 */
import { NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { sendDowngradeEmail } from '@/lib/emails';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2026-03-25.dahlia',
    })
  : null;

export async function POST() {
  try {
    if (!stripe) {
      return NextResponse.json(
        { error: 'Stripe is not configured. Set STRIPE_SECRET_KEY.' },
        { status: 500 }
      );
    }

    const supabase = await createClient();
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.email) {
      return NextResponse.json({ error: 'User email is missing.' }, { status: 400 });
    }

    const customers = await stripe.customers.list({
      email: user.email,
      limit: 10,
    });

    let canceledSubscriptions = 0;

    for (const customer of customers.data) {
      if (typeof customer === 'string') continue;

      const subs = await stripe.subscriptions.list({
        customer: customer.id,
        limit: 100,
      });

      for (const sub of subs.data) {
        if (sub.status === 'canceled' || sub.status === 'incomplete_expired') {
          continue;
        }

        await stripe.subscriptions.cancel(sub.id);
        canceledSubscriptions += 1;
      }
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ subscription_status: 'free' })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update subscription status.' }, { status: 500 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    // Send the "Subscription Cancelled" email via our Gmail SMTP.
    // Wrapped in try/catch so if email fails, the downgrade still completes.
    try {
      await sendDowngradeEmail(user.email, profile?.display_name);
    } catch {
      // Email failure should not block the downgrade — cancellation already happened
    }

    return NextResponse.json({ ok: true, canceledSubscriptions });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to cancel Stripe subscription.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
