import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export type FaqItem = { question: string; answer: string };

export default function FaqsBlock({
  items,
  title = "Frequently asked questions",
  description = "Answers to the questions we hear most often.",
  compact = false,
}: {
  items: FaqItem[];
  title?: string;
  description?: string;
  compact?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <section
      className={
        compact
          ? "w-full text-foreground"
          : "flex w-full items-center justify-center bg-background px-6 py-12 text-foreground"
      }
    >
      <div className={compact ? "w-full" : "w-full max-w-2xl"}>
        {!compact && (
          <div className="text-center">
            <h2 className="font-heading text-3xl font-bold tracking-tight sm:text-4xl">{title}</h2>
            <p className="mt-3 text-muted-foreground">{description}</p>
          </div>
        )}

        <Accordion defaultValue={[items[0].question]} className={compact ? "" : "mt-10"}>
          {items.map(({ question, answer }) => (
            <AccordionItem key={question} value={question}>
              <AccordionTrigger className="py-4 text-base font-medium">{question}</AccordionTrigger>
              <AccordionContent className="pb-4 text-base text-muted-foreground">{answer}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
