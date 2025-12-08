import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { createClient } from '@supabase/supabase-js'
import { stripe } from '@/lib/stripe'
import Stripe from 'stripe'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey)

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET!

export async function POST(request: NextRequest) {
  const body = await request.text()
  const headersList = await headers()
  const signature = headersList.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'No signature' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session
        const accountId = session.metadata?.accountId
        const planTier = session.metadata?.planTier as 'pro' | 'premium'

        if (accountId && planTier && session.customer) {
          const customerId = typeof session.customer === 'string' 
            ? session.customer 
            : session.customer.id

          // Update account plan
          await supabaseAdmin
            .from('accounts')
            .update({
              plan_tier: planTier,
              subscription_status: 'active',
            })
            .eq('id', accountId)

          // Ensure customer ID is saved to account if not already set
          const { data: account } = await supabaseAdmin
            .from('accounts')
            .select('stripe_customer_id')
            .eq('id', accountId)
            .single()

          if (account && !account.stripe_customer_id) {
            await supabaseAdmin
              .from('accounts')
              .update({ stripe_customer_id: customerId })
              .eq('id', accountId)
          }

          // Retrieve the payment method from the session and link it to the customer
          // For subscriptions, retrieve from the subscription's default payment method
          if (session.subscription) {
            try {
              // Retrieve subscription with payment method
              const subscription = await stripe.subscriptions.retrieve(
                session.subscription as string,
                { expand: ['default_payment_method'] }
              )
              
              // Get payment method from subscription
              let paymentMethodId: string | null = null
              
              if (subscription.default_payment_method) {
                paymentMethodId = typeof subscription.default_payment_method === 'string'
                  ? subscription.default_payment_method
                  : subscription.default_payment_method.id
              } else {
                // If no default payment method, try to get from latest invoice
                const invoices = await stripe.invoices.list({
                  subscription: subscription.id,
                  limit: 1,
                })
                
                if (invoices.data.length > 0) {
                  const invoice = invoices.data[0]
                  if (invoice.payment_intent) {
                    const paymentIntentId = typeof invoice.payment_intent === 'string'
                      ? invoice.payment_intent
                      : invoice.payment_intent.id
                    
                    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId, {
                      expand: ['payment_method']
                    })
                    
                    if (paymentIntent.payment_method) {
                      paymentMethodId = typeof paymentIntent.payment_method === 'string'
                        ? paymentIntent.payment_method
                        : paymentIntent.payment_method.id
                    }
                  }
                }
              }

              // If we found a payment method, attach it to the customer and set as default
              if (paymentMethodId) {
                try {
                  // Check if payment method is already attached
                  const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
                  
                  if (!paymentMethod.customer) {
                    // Attach payment method to customer
                    await stripe.paymentMethods.attach(paymentMethodId, {
                      customer: customerId,
                    })
                  }

                  // Set as default payment method for the customer
                  await stripe.customers.update(customerId, {
                    invoice_settings: {
                      default_payment_method: paymentMethodId,
                    },
                  })

                  console.log(`Payment method ${paymentMethodId} attached and set as default for customer ${customerId}`)
                } catch (attachError: any) {
                  // If already attached, that's fine - just set as default
                  if (attachError.code !== 'resource_already_exists') {
                    console.error('Error attaching payment method:', attachError)
                  } else {
                    // Set as default even if already attached
                    try {
                      await stripe.customers.update(customerId, {
                        invoice_settings: {
                          default_payment_method: paymentMethodId,
                        },
                      })
                    } catch (updateError) {
                      console.error('Error setting default payment method:', updateError)
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error handling payment method in checkout.session.completed:', error)
            }
          }
        }
        break
      }

      case 'customer.subscription.created':
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // Find account by Stripe customer ID
        const { data: account } = await supabaseAdmin
          .from('accounts')
          .select('id')
          .eq('stripe_customer_id', customerId)
          .single()

        if (account) {
          if (subscription.status === 'active' || subscription.status === 'trialing') {
            // Determine plan tier from subscription
            const priceId = subscription.items.data[0]?.price.id
            let planTier = 'free'
            
            if (priceId === process.env.STRIPE_PRO_PRICE_ID) {
              planTier = 'pro'
            } else if (priceId === process.env.STRIPE_PREMIUM_PRICE_ID) {
              planTier = 'premium'
            }

            await supabaseAdmin
              .from('accounts')
              .update({
                plan_tier: planTier,
                subscription_status: subscription.status,
              })
              .eq('id', account.id)

            // Ensure payment method is attached to customer and set as default
            if (subscription.default_payment_method) {
              try {
                const paymentMethodId = typeof subscription.default_payment_method === 'string'
                  ? subscription.default_payment_method
                  : subscription.default_payment_method.id
                
                // Check if payment method is already attached
                const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId)
                
                if (!paymentMethod.customer) {
                  // Attach payment method to customer
                  await stripe.paymentMethods.attach(paymentMethodId, {
                    customer: customerId,
                  })
                }

                // Set as default payment method for the customer
                await stripe.customers.update(customerId, {
                  invoice_settings: {
                    default_payment_method: paymentMethodId,
                  },
                })
              } catch (error: any) {
                // If already attached, that's fine - just set as default
                if (error.code !== 'resource_already_exists') {
                  console.error('Error attaching payment method to customer:', error)
                } else {
                  // Set as default even if already attached
                  try {
                    const paymentMethodId = typeof subscription.default_payment_method === 'string'
                      ? subscription.default_payment_method
                      : subscription.default_payment_method.id
                    
                    await stripe.customers.update(customerId, {
                      invoice_settings: {
                        default_payment_method: paymentMethodId,
                      },
                    })
                  } catch (updateError) {
                    console.error('Error setting default payment method:', updateError)
                  }
                }
              }
            }
          } else {
            // Subscription canceled or past due
            await supabaseAdmin
              .from('accounts')
              .update({
                plan_tier: 'free',
                subscription_status: subscription.status,
              })
              .eq('id', account.id)
          }
        }
        break
      }

      case 'setup_intent.succeeded': {
        // Handle setup intents (when payment methods are saved separately)
        const setupIntent = event.data.object as Stripe.SetupIntent
        const customerId = setupIntent.customer as string
        const paymentMethodId = setupIntent.payment_method as string

        if (customerId && paymentMethodId) {
          try {
            // Payment method is already attached in setup_intent.succeeded
            // Just ensure it's set as default if there's no default yet
            const customer = await stripe.customers.retrieve(customerId)
            
            if (typeof customer !== 'string' && !customer.deleted) {
              if (!customer.invoice_settings?.default_payment_method) {
                await stripe.customers.update(customerId, {
                  invoice_settings: {
                    default_payment_method: paymentMethodId,
                  },
                })
                console.log(`Set payment method ${paymentMethodId} as default for customer ${customerId}`)
              }
            }
          } catch (error) {
            console.error('Error handling setup_intent.succeeded:', error)
          }
        }
        break
      }

      case 'payment_method.attached': {
        // When a payment method is attached to a customer, ensure it's available
        const paymentMethod = event.data.object as Stripe.PaymentMethod
        const customerId = paymentMethod.customer as string

        if (customerId) {
          try {
            // Check if this is the only payment method, if so set as default
            const paymentMethods = await stripe.paymentMethods.list({
              customer: customerId,
              type: 'card',
            })

            if (paymentMethods.data.length === 1) {
              await stripe.customers.update(customerId, {
                invoice_settings: {
                  default_payment_method: paymentMethod.id,
                },
              })
            }
          } catch (error) {
            console.error('Error handling payment_method.attached:', error)
          }
        }
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Error processing webhook:', error)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

