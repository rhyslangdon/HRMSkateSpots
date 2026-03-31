import { NextRequest, NextResponse } from 'next/server';
import Stripe from 'stripe';
import { createClient } from '@/lib/supabase/server';
import { sendPremiumWelcomeEmail } from '@/lib/emails';

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;

const stripe = stripeSecretKey
  ? new Stripe(stripeSecretKey, {
      apiVersion: '2026-03-25.dahlia',
    })
  : null;

export async function POST(request: NextRequest) {
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

    const payload = (await request.json().catch(() => ({}))) as { sessionId?: string };

    if (!payload.sessionId) {
      return NextResponse.json({ error: 'Missing sessionId.' }, { status: 400 });
    }

    const session = await stripe.checkout.sessions.retrieve(payload.sessionId);

    const isPaid =
      session.payment_status === 'paid' ||
      session.status === 'complete' ||
      session.subscription !== null;

    const userIdFromSession =
      session.client_reference_id || session.metadata?.userId || session.customer_details?.email;

    const matchesUser =
      session.client_reference_id === user.id || session.customer_details?.email === user.email;

    if (!isPaid || !matchesUser || !userIdFromSession) {
      return NextResponse.json({ error: 'Payment not completed for this user.' }, { status: 400 });
    }

    const { error: updateError } = await supabase
      .from('profiles')
      .update({ subscription_status: 'premium' })
      .eq('id', user.id);

    if (updateError) {
      return NextResponse.json({ error: 'Failed to update subscription status.' }, { status: 500 });
    }

    const { data: profile } = await supabase
      .from('profiles')
      .select('display_name')
      .eq('id', user.id)
      .single();

    try {
      await sendPremiumWelcomeEmail(user.email!, profile?.display_name);
    } catch {
      // Email failure should not block the upgrade
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to confirm checkout session.';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
