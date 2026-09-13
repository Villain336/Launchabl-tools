import type { Metadata } from "next";
import { Container } from "@/components/ui/container";
import { ReviewForm } from "@/components/marketplace/review-form";

export const metadata: Metadata = {
  title: "Leave a review",
  robots: { index: false, follow: false },
};

export default async function ReviewPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  return (
    <Container className="py-16 sm:py-24">
      <h1 className="font-heading text-3xl font-bold">Review completed work</h1>
      <p className="mt-2 max-w-lg text-sm text-muted-foreground">
        This link only works after the job is done. We do not accept public drive-by stars.
      </p>
      <div className="mt-8 max-w-md">
        <ReviewForm token={token} />
      </div>
    </Container>
  );
}
