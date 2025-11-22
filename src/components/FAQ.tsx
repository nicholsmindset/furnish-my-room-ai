import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  const faqs = [
    {
      question: "Will buyers know it's virtual staging?",
      answer:
        "Our AI creates photorealistic furniture placement that matches lighting, shadows, and room dimensions. 94% of viewers cannot distinguish AI staging from photographs of real furniture.",
    },
    {
      question: "What if I don't like the result?",
      answer:
        "Re-render in a different style for free. Still not happy? Full refund. We stand behind every image.",
    },
    {
      question: "Can I use these photos on MLS and marketing?",
      answer:
        "Yes. Full commercial usage rights included. Use on MLS, social media, listing presentations, brochures, and print materials.",
    },
    {
      question: "How does this compare to hiring a staging company?",
      answer:
        "Traditional staging runs $300-500 per room with 48-72 hour turnaround and scheduling coordination. AI staging costs under $10 per room, delivers in 30 seconds, and requires zero coordination.",
    },
    {
      question: "What room types can I stage?",
      answer:
        "Living rooms, bedrooms, kitchens, dining rooms, bathrooms, home offices, and outdoor spaces. Any empty room with clear walls and floors.",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="max-w-3xl mx-auto px-6">
        <h2 className="text-4xl font-bold text-center mb-12">Common Questions</h2>
        <Accordion type="single" collapsible className="w-full">
          {faqs.map((faq, idx) => (
            <AccordionItem key={idx} value={`item-${idx}`}>
              <AccordionTrigger className="text-left text-lg font-medium">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground text-base">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
