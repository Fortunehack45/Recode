---
title: Billing
description: Manage billing for your Recode subscription, including payment methods, invoices, and sales tax information for individual and organization accounts.
---

# Billing

Recode uses Stripe for secure payment processing. All plans that require payment do so via credit card or other supported payment methods. Individual Pro subscriptions also use Orb for invoicing and metering.

For details on what's included in each plan and how token usage works, see [Plans & Pricing](./plans-and-pricing.md).

## Individual billing {#individual}

### Billing information {#settings}

Access billing information and settings from your [Recode dashboard](https://dashboard.recode.dev).

### Billing cycles {#billing-cycles}

Recode is billed on a monthly basis based on the date you initially subscribe. You'll receive _at least_ one invoice from Recode each month you're subscribed to Recode Pro, and may receive more than one invoice if you use [hosted models](./recode-hosted-models.md) beyond your included monthly token credit.

### Recode Pro threshold billing {#threshold-billing}

For individual Recode Pro subscriptions, Recode uses threshold billing to ensure timely payment collection. Threshold billing controls when already-allowed token usage is invoiced during the month; your [monthly spend limit](./plans-and-pricing.md#usage-spend-limits) still controls when hosted model usage stops.

Threshold invoices start at $10 of pre-tax incremental token spend. For higher token usage, Recode may automatically raise your pre-tax invoicing threshold in $10 increments, up to $100, so you receive fewer mid-cycle invoices. Once raised, the invoicing threshold is not automatically lowered during the same subscription.

For Recode Business billing, see [Organization billing](#organization).

### Payment failures {#payment-failures}

If payment of an invoice fails, Recode will block usage of our hosted models until the payment is complete. Email [billing@recode.dev](mailto:billing@recode.dev) for assistance.

### Invoice history {#invoice-history}

You can access your invoice history from the Billing page at [dashboard.recode.dev](https://dashboard.recode.dev).

If you require historical invoices, email [billing@recode.dev](mailto:billing@recode.dev).

## Organization billing {#organization}

Recode Business consolidates your team's costs. Paid Business seats and member AI usage appear on one bill, with no separate invoices per member. For a full feature overview, see [Recode Business](../business/overview.md).

### Billing dashboard {#dashboard}

Owners, admins, and Billing Managers can access billing information at [dashboard.recode.dev](https://dashboard.recode.dev). The dashboard shows the current plan and links to update billing details, tax ID information, and payment information.

Use the Billing Manager role for someone who needs billing access but does not need a paid Business seat. Billing Managers can view subscription usage, update billing details and payment methods, and access invoice history.

### AI usage {#ai-usage}

AI usage across the organization is metered on a token basis at the same rates as individual Pro subscriptions. See [Plans & Pricing](./plans-and-pricing.md#usage) for rate details.
