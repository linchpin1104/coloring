import Stripe from 'stripe';
import { logger } from '../utils/logger';
import { DatabaseService } from './databaseService';

interface PaymentIntentRequest {
  userId: string;
  amount: number; // 포인트 수량
  currency: string;
  paymentMethod?: string;
  metadata?: Record<string, string>;
}

interface PaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
  amount: number;
  currency: string;
}

interface WebhookEvent {
  type: string;
  data: {
    object: any;
  };
}

export class RealPaymentService {
  private stripe: Stripe;
  private dbService: DatabaseService;

  constructor() {
    const stripeSecretKey = process.env['STRIPE_SECRET_KEY'];
    
    if (!stripeSecretKey) {
      throw new Error('Stripe secret key is not configured');
    }

    this.stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });
    
    this.dbService = new DatabaseService();
    
    logger.info('Real Payment Service initialized');
  }

  /**
   * 결제 인텐트 생성
   */
  async createPaymentIntent(request: PaymentIntentRequest): Promise<PaymentIntentResponse> {
    try {
      logger.info('Creating payment intent', {
        userId: request.userId,
        amount: request.amount,
        currency: request.currency,
      });

      // 포인트당 가격 (예: 1포인트 = 0.01 USD)
      const pointPrice = 0.01;
      const totalAmount = Math.round(request.amount * pointPrice * 100); // 센트 단위

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: totalAmount,
        currency: request.currency,
        metadata: {
          userId: request.userId,
          points: request.amount.toString(),
          type: 'point_charge',
          ...request.metadata,
        },
        automatic_payment_methods: {
          enabled: true,
        },
        description: `${request.amount}포인트 충전`,
      });

      logger.info('Payment intent created successfully', {
        paymentIntentId: paymentIntent.id,
        amount: totalAmount,
        currency: request.currency,
      });

      return {
        clientSecret: paymentIntent.client_secret!,
        paymentIntentId: paymentIntent.id,
        amount: totalAmount,
        currency: request.currency,
      };
    } catch (error) {
      logger.error('Failed to create payment intent', {
        error: error instanceof Error ? error.message : 'Unknown error',
        request,
      });
      throw error;
    }
  }

  /**
   * 결제 인텐트 확인
   */
  async confirmPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        logger.info('Payment intent already succeeded', { paymentIntentId });
        return paymentIntent;
      }

      const confirmedPaymentIntent = await this.stripe.paymentIntents.confirm(paymentIntentId);
      
      logger.info('Payment intent confirmed', {
        paymentIntentId,
        status: confirmedPaymentIntent.status,
      });

      return confirmedPaymentIntent;
    } catch (error) {
      logger.error('Failed to confirm payment intent', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentIntentId,
      });
      throw error;
    }
  }

  /**
   * 결제 취소
   */
  async cancelPaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.cancel(paymentIntentId);
      
      logger.info('Payment intent cancelled', {
        paymentIntentId,
        status: paymentIntent.status,
      });

      return paymentIntent;
    } catch (error) {
      logger.error('Failed to cancel payment intent', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentIntentId,
      });
      throw error;
    }
  }

  /**
   * 환불 처리
   */
  async createRefund(paymentIntentId: string, amount?: number): Promise<Stripe.Refund> {
    try {
      const refund = await this.stripe.refunds.create({
        payment_intent: paymentIntentId,
        amount,
        reason: 'requested_by_customer',
      });

      logger.info('Refund created successfully', {
        refundId: refund.id,
        paymentIntentId,
        amount: refund.amount,
      });

      return refund;
    } catch (error) {
      logger.error('Failed to create refund', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentIntentId,
        amount,
      });
      throw error;
    }
  }

  /**
   * 웹훅 이벤트 처리
   */
  async handleWebhookEvent(event: WebhookEvent): Promise<void> {
    try {
      logger.info('Processing webhook event', {
        type: event.type,
        id: event.data.object.id,
      });

      switch (event.type) {
      case 'payment_intent.succeeded':
        await this.handlePaymentSucceeded(event.data.object);
        break;
      case 'payment_intent.payment_failed':
        await this.handlePaymentFailed(event.data.object);
        break;
      case 'charge.dispute.created':
        await this.handleDisputeCreated(event.data.object);
        break;
      default:
        logger.info('Unhandled webhook event type', { type: event.type });
      }
    } catch (error) {
      logger.error('Failed to handle webhook event', {
        error: error instanceof Error ? error.message : 'Unknown error',
        eventType: event.type,
      });
      throw error;
    }
  }

  /**
   * 결제 성공 처리
   */
  private async handlePaymentSucceeded(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const { userId } = paymentIntent.metadata;
      const points = parseInt(paymentIntent.metadata.points);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { amount: _amount } = paymentIntent;

      if (!userId || !points) {
        logger.error('Invalid payment intent metadata', {
          paymentIntentId: paymentIntent.id,
          metadata: paymentIntent.metadata,
        });
        return;
      }

      // 사용자 포인트 충전
      await this.dbService.updateUserPoints(userId, points);

      // 트랜잭션 기록
      await this.dbService.createTransaction({
        userId,
        type: 'charge',
        amount: points,
        description: `${points}포인트 충전 (Stripe)`,
        paymentMethod: 'stripe',
        stripePaymentIntentId: paymentIntent.id,
        status: 'completed',
        completedAt: new Date().toISOString(),
      });

      logger.info('Payment succeeded and points added', {
        userId,
        points,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      logger.error('Failed to handle payment succeeded', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentIntentId: paymentIntent.id,
      });
      throw error;
    }
  }

  /**
   * 결제 실패 처리
   */
  private async handlePaymentFailed(paymentIntent: Stripe.PaymentIntent): Promise<void> {
    try {
      const { userId } = paymentIntent.metadata;
      const points = parseInt(paymentIntent.metadata.points);

      if (!userId || !points) {
        logger.error('Invalid payment intent metadata', {
          paymentIntentId: paymentIntent.id,
          metadata: paymentIntent.metadata,
        });
        return;
      }

      // 트랜잭션 기록 (실패)
      await this.dbService.createTransaction({
        userId,
        type: 'charge',
        amount: points,
        description: `${points}포인트 충전 실패 (Stripe)`,
        paymentMethod: 'stripe',
        stripePaymentIntentId: paymentIntent.id,
        status: 'failed',
      });

      logger.info('Payment failed recorded', {
        userId,
        points,
        paymentIntentId: paymentIntent.id,
      });
    } catch (error) {
      logger.error('Failed to handle payment failed', {
        error: error instanceof Error ? error.message : 'Unknown error',
        paymentIntentId: paymentIntent.id,
      });
      throw error;
    }
  }

  /**
   * 분쟁 처리
   */
  private async handleDisputeCreated(dispute: Stripe.Dispute): Promise<void> {
    try {
      const paymentIntentId = dispute.payment_intent;
      
      // 결제 인텐트 조회
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId as string);
      const { userId } = paymentIntent.metadata;
      const points = parseInt(paymentIntent.metadata.points);

      if (!userId || !points) {
        logger.error('Invalid payment intent metadata for dispute', {
          disputeId: dispute.id,
          paymentIntentId,
          metadata: paymentIntent.metadata,
        });
        return;
      }

      // 사용자 포인트 차감 (분쟁으로 인한 환불)
      await this.dbService.updateUserPoints(userId, -points);

      // 트랜잭션 기록
      await this.dbService.createTransaction({
        userId,
        type: 'refund',
        amount: -points,
        description: `${points}포인트 환불 (분쟁)`,
        paymentMethod: 'stripe',
        stripePaymentIntentId: paymentIntentId as string,
        status: 'completed',
        completedAt: new Date().toISOString(),
      });

      logger.info('Dispute handled and points refunded', {
        userId,
        points,
        disputeId: dispute.id,
        paymentIntentId,
      });
    } catch (error) {
      logger.error('Failed to handle dispute', {
        error: error instanceof Error ? error.message : 'Unknown error',
        disputeId: dispute.id,
      });
      throw error;
    }
  }

  /**
   * 웹훅 서명 검증
   */
  verifyWebhookSignature(payload: string, signature: string): Stripe.Event {
    try {
      const webhookSecret = process.env['STRIPE_WEBHOOK_SECRET'];
      
      if (!webhookSecret) {
        throw new Error('Stripe webhook secret is not configured');
      }

      const event = this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
      
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
  }

  /**
   * 고객 생성
   */
  async createCustomer(userId: string, email: string, name?: string): Promise<Stripe.Customer> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: {
          userId,
        },
      });

      logger.info('Customer created successfully', {
        customerId: customer.id,
        userId,
        email,
      });

      return customer;
    } catch (error) {
      logger.error('Failed to create customer', {
        error: error instanceof Error ? error.message : 'Unknown error',
        userId,
        email,
      });
      throw error;
    }
  }

  /**
   * 고객 조회
   */
  async getCustomer(customerId: string): Promise<Stripe.Customer | null> {
    try {
      const customer = await this.stripe.customers.retrieve(customerId);
      
      if (customer.deleted) {
        return null;
      }

      return customer as Stripe.Customer;
    } catch (error) {
      logger.error('Failed to get customer', {
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId,
      });
      return null;
    }
  }

  /**
   * 결제 방법 조회
   */
  async getPaymentMethods(customerId: string): Promise<Stripe.PaymentMethod[]> {
    try {
      const paymentMethods = await this.stripe.paymentMethods.list({
        customer: customerId,
        type: 'card',
      });

      logger.info('Payment methods retrieved', {
        customerId,
        count: paymentMethods.data.length,
      });

      return paymentMethods.data;
    } catch (error) {
      logger.error('Failed to get payment methods', {
        error: error instanceof Error ? error.message : 'Unknown error',
        customerId,
      });
      throw error;
    }
  }
}

export default RealPaymentService;
