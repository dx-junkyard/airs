import Accordion from '@/components/ui/Accordion/Accordion';
import AccordionContent from '@/components/ui/Accordion/AccordionContent';
import AccordionSummary from '@/components/ui/Accordion/AccordionSummary';
import { Card } from '@/components/ui/Card/Card';

export interface FAQItem {
  question: string;
  answer: string;
}

export interface FAQSectionProps {
  title?: string;
  items: FAQItem[];
  id?: string;
  className?: string;
}

export const FAQSection = ({
  title = 'よくある質問',
  items,
  id,
  className,
}: FAQSectionProps) => {
  return (
    <Card title={title} padding="lg" id={id} className={className}>
      <div className="space-y-3">
        {items.map((item, index) => (
          <Accordion key={index}>
            <AccordionSummary>{item.question}</AccordionSummary>
            <AccordionContent>{item.answer}</AccordionContent>
          </Accordion>
        ))}
      </div>
    </Card>
  );
};
