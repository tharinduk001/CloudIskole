import { CheckCircle2, Clock3, XCircle } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { PhoneVerifyCard } from "@/components/payments/phone-verify-card";
import { SlipUploader } from "@/components/payments/slip-uploader";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container, Section } from "@/components/ui/layout";
import { requireProfile } from "@/lib/data/auth";
import { bankTransferAccount } from "@/lib/payments/bank-details";
import { getBankTransferForOrder, getOrderForCheckout, getSlipSignedUrl } from "@/lib/data/payments";
import { formatLkr } from "@/lib/format";

export const metadata: Metadata = { title: "Checkout" };

export default async function CheckoutPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const { orderId } = await params;
  const profile = await requireProfile(`/checkout/${orderId}`);
  const order = await getOrderForCheckout(orderId);
  const bankTransfer = await getBankTransferForOrder(orderId);
  const slipUrl = bankTransfer ? await getSlipSignedUrl(bankTransfer.slip_path) : null;

  return (
    <Section className="py-10 sm:py-14">
      <Container size="narrow" className="max-w-2xl">
        <h1 className="font-display text-2xl font-semibold">Checkout</h1>
        <p className="text-ink-muted mt-1 text-sm">{order.course.title}</p>

        <div className="mt-8 flex flex-col gap-6">
          <OrderStatusCard order={order} rejectReason={bankTransfer?.reject_reason ?? null} />

          {order.status === "paid" ? (
            <Card className="p-6 text-center">
              <CheckCircle2 className="mx-auto size-8 text-teal-600" aria-hidden="true" />
              <p className="text-ink mt-3 text-sm font-medium">
                Payment confirmed — you&rsquo;re enrolled.
              </p>
              <Button asChild className="mt-4">
                <Link href={`/courses/${order.course.slug}`}>Go to course</Link>
              </Button>
            </Card>
          ) : (
            <>
              <Card className="p-6">
                <h2 className="text-ink text-sm font-semibold">Bank transfer details</h2>
                <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-4 gap-y-2.5 text-sm">
                  <dt className="text-ink-muted">Bank</dt>
                  <dd className="text-ink font-medium">{bankTransferAccount.bankName}</dd>
                  <dt className="text-ink-muted">Branch</dt>
                  <dd className="text-ink font-medium">{bankTransferAccount.branch}</dd>
                  <dt className="text-ink-muted">Account name</dt>
                  <dd className="text-ink font-medium">{bankTransferAccount.accountName}</dd>
                  <dt className="text-ink-muted">Account number</dt>
                  <dd className="text-ink font-mono font-medium">
                    {bankTransferAccount.accountNumber}
                  </dd>
                  <dt className="text-ink-muted">Amount</dt>
                  <dd className="text-ink font-semibold">{formatLkr(order.amount_cents)}</dd>
                  <dt className="text-ink-muted">Reference</dt>
                  <dd>
                    <span className="rounded-md bg-teal-50 px-2 py-1 font-mono font-semibold text-teal-700">
                      {order.reference_code}
                    </span>
                  </dd>
                </dl>
                <p className="text-ink-subtle mt-4 text-xs leading-relaxed">
                  Write <strong className="text-ink">{order.reference_code}</strong> on your
                  transfer so we can match it to your order, then upload your receipt below.
                </p>
              </Card>

              {!profile.phone_verified_at ? (
                <PhoneVerifyCard currentPhone={profile.phone} />
              ) : order.status === "under_review" ? (
                <Card className="p-6">
                  <Clock3 className="size-5 text-gold-600" aria-hidden="true" />
                  <p className="text-ink mt-2 text-sm font-medium">
                    Your slip is being reviewed.
                  </p>
                  <p className="text-ink-muted mt-1 text-xs">
                    We&rsquo;ll email you once it&rsquo;s confirmed — usually within one business day.
                  </p>
                  {slipUrl ? (
                    <a
                      href={slipUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="mt-3 inline-block text-xs font-medium text-teal-600 hover:underline"
                    >
                      View submitted slip
                    </a>
                  ) : null}
                </Card>
              ) : (
                <SlipUploader
                  userId={profile.id}
                  orderId={order.id}
                  rejectReason={bankTransfer?.reject_reason}
                />
              )}
            </>
          )}
        </div>
      </Container>
    </Section>
  );
}

function OrderStatusCard({
  order,
  rejectReason,
}: {
  order: { status: string };
  rejectReason: string | null;
}) {
  if (order.status === "rejected") {
    return (
      <div className="border-danger/20 bg-danger-soft flex items-start gap-3 rounded-2xl border p-4">
        <XCircle className="text-danger mt-0.5 size-5 shrink-0" aria-hidden="true" />
        <div>
          <p className="text-danger text-sm font-medium">Your last slip was declined.</p>
          {rejectReason ? (
            <p className="text-ink-muted mt-0.5 text-xs">{rejectReason}</p>
          ) : null}
          <p className="text-ink-muted mt-0.5 text-xs">
            Upload a new receipt below and we&rsquo;ll take another look.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2">
      <Badge
        variant={
          order.status === "paid" ? "success" : order.status === "under_review" ? "warning" : "neutral"
        }
      >
        {order.status === "pending"
          ? "Awaiting your transfer"
          : order.status === "under_review"
            ? "Under review"
            : order.status === "paid"
              ? "Paid"
              : order.status}
      </Badge>
    </div>
  );
}
