import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { RequestStatus } from "@/components/marketplace/request-status";

export default async function RequestPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ token?: string; paid?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  if (!query.token) {
    return (
      <Container className="py-16">
        <SectionHeading
          eyebrow="Your request"
          title="This link is missing its token"
          description="Use the page you landed on after sending the request. We do not look up jobs by name."
        />
      </Container>
    );
  }
  return (
    <Container className="py-16">
      <SectionHeading
        eyebrow="Your request"
        title="Quote and pay in one place"
        description="Stay on this page. When a crew claims the job and sends a price, you pay here — no calling around."
      />
      <div className="mt-8 max-w-lg">
        <RequestStatus offerId={id} token={query.token} paidJustNow={query.paid === "1"} />
      </div>
    </Container>
  );
}
