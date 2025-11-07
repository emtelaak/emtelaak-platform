import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { APP_LOGO } from "@/const";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function FAQ() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  const faqs = [
    {
      question: t.faq.questions.q1.question,
      answer: t.faq.questions.q1.answer,
    },
    {
      question: t.faq.questions.q2.question,
      answer: t.faq.questions.q2.answer,
    },
    {
      question: t.faq.questions.q3.question,
      answer: t.faq.questions.q3.answer,
    },
    {
      question: t.faq.questions.q4.question,
      answer: t.faq.questions.q4.answer,
    },
    {
      question: t.faq.questions.q5.question,
      answer: t.faq.questions.q5.answer,
    },
    {
      question: t.faq.questions.q6.question,
      answer: t.faq.questions.q6.answer,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <img src={APP_LOGO} alt="Emtelaak" className="h-20 w-auto cursor-pointer" />
          </Link>
          
          <div className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t.nav.home}
            </Link>
            <Link href="/properties" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t.nav.properties}
            </Link>
            <Link href="/how-it-works" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t.nav.howItWorks}
            </Link>
            <Link href="/about" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t.nav.about}
            </Link>
            <Link href="/faq" className="text-sm font-medium text-primary transition-colors">
              {t.nav.faq}
            </Link>
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <Link href="/profile">
                <Button variant="ghost">{t.nav.profile}</Button>
              </Link>
            ) : (
              <Link href="/profile">
                <Button>{t.nav.getStarted}</Button>
              </Link>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="bg-gradient-to-b from-primary/10 to-background py-16">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              {t.faq.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t.faq.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Content */}
      <section className="flex-1 py-16">
        <div className="container max-w-4xl">
          <Accordion type="single" collapsible className="w-full space-y-4">
            {faqs.map((faq, index) => (
              <AccordionItem 
                key={index} 
                value={`item-${index}`}
                className="border rounded-lg px-6 bg-card"
              >
                <AccordionTrigger className="text-left hover:no-underline py-6">
                  <span className="text-lg font-semibold">{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-6 leading-relaxed">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>

          {/* CTA Section */}
          <div className="mt-16 text-center p-8 bg-muted/50 rounded-lg">
            <h3 className="text-2xl font-bold mb-4">{t.faq.stillHaveQuestions}</h3>
            <p className="text-muted-foreground mb-6">
              {t.faq.contactPrompt}
            </p>
            <Link href="/contact">
              <Button size="lg">{t.faq.contactUs}</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
