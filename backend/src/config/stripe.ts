import Stripe from 'stripe';
import { logger } from '@/utils/logger';

// Stripe API 키 설정
const stripeSecretKey = process.env['STRIPE_SECRET_KEY'] || 'sk_test_demo_key';
const stripePublishableKey = process.env['STRIPE_PUBLISHABLE_KEY'] || 'pk_test_demo_key';
const stripeWebhookSecret = process.env['STRIPE_WEBHOOK_SECRET'] || 'whsec_demo_secret';

// Stripe 인스턴스 생성
export const stripe = new Stripe(stripeSecretKey, {
  apiVersion: '2023-10-16',
});

// Stripe 설정 정보
export const stripeConfig = {
  secretKey: stripeSecretKey,
  publishableKey: stripePublishableKey,
  webhookSecret: stripeWebhookSecret,
};

// 결제 의도 생성
export const createPaymentIntent = async (
  amount: number,
  currency: string = 'usd',
  metadata?: Record<string, string>,
): Promise<Stripe.PaymentIntent> => {
  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata: metadata || {},
      automatic_payment_methods: {
        enabled: true,
      },
    });

    logger.info('Payment intent created', {
      id: paymentIntent.id,
      amount,
      currency,
    });

    return paymentIntent;
  } catch (error) {
    logger.error('Failed to create payment intent', {
      error: error instanceof Error ? error.message : 'Unknown error',
      amount,
      currency,
    });
    throw error;
  }
};

// 웹훅 이벤트 검증
export const verifyWebhookSignature = (
  payload: string,
  signature: string,
): Stripe.Event => {
  try {
    const event = stripe.webhooks.constructEvent(
      payload,
      signature,
      stripeWebhookSecret,
    );

    logger.info('Webhook signature verified', {
      eventId: event.id,
      eventType: event.type,
    });

    return event;
  } catch (error) {
    logger.error('Failed to verify webhook signature', {
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

// 포인트 충전을 위한 결제 세션 생성
export const createPointsChargeSession = async (
  userId: string,
  points: number,
  amount: number,
): Promise<Stripe.Checkout.Session> => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: `${points} Points`,
              description: `Charge ${points} points to your account`,
            },
            unit_amount: amount * 100, // 센트 단위로 변환
          },
          quantity: 1,
        },
      ],
      mode: 'payment',
      success_url: `${process.env['CORS_ORIGIN'] || 'http://localhost:3000'}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env['CORS_ORIGIN'] || 'http://localhost:3000'}/payment/cancel`,
      metadata: {
        userId,
        points: points.toString(),
        type: 'points_charge',
      },
    });

    logger.info('Points charge session created', {
      sessionId: session.id,
      userId,
      points,
      amount,
    });

    return session;
  } catch (error) {
    logger.error('Failed to create points charge session', {
      error: error instanceof Error ? error.message : 'Unknown error',
      userId,
      points,
      amount,
    });
    throw error;
  }
};

export default stripe;