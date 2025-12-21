import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Link } from "wouter";
import { APP_LOGO, APP_TITLE } from "@/const";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Mail, Phone, MapPin, Send, CheckCircle2, ChevronDown, TrendingUp } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import Footer from "@/components/Footer";
import { InvestorLeadForm } from "@/components/InvestorLeadForm";

export default function Contact() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const contactMutation = trpc.contact.submit.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setFormData({ name: "", email: "", subject: "", message: "" });
      toast.success("Message sent successfully! We'll get back to you soon.");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast.error("Please fill in all fields");
      return;
    }

    contactMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer">
              <img src={APP_LOGO} alt={APP_TITLE} className="h-20 w-auto" />
            </div>
          </Link>
          <Link href="/">
            <Button variant="outline">Back to Home</Button>
          </Link>
        </div>
      </nav>

      {/* Hero Section - Matching emtelaak.com design */}
      <section className="relative overflow-hidden py-24 md:py-32" style={{
        backgroundImage: 'linear-gradient(rgba(0, 43, 73, 0.9), rgba(0, 43, 73, 0.9)), url("https://images.unsplash.com/photo-1423666639041-f56000c27a9a?w=1920&q=80")',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}>
        <div className="container">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 text-white">
              Get in Touch
            </h1>
            <p className="text-xl text-white/90 leading-relaxed">
              Have questions? We'd love to hear from you. Send us a message and we'll respond as soon as possible.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <div className="container py-16">
        <div className="max-w-5xl mx-auto">

          <div className="grid md:grid-cols-3 gap-8 mb-12">
            {/* Contact Info Cards */}
            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Mail className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Email Us</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <a 
                  href="mailto:support@emtelaak.com" 
                  className="text-primary hover:underline"
                >
                  support@emtelaak.com
                </a>
                <p className="text-sm text-muted-foreground mt-2">
                  We'll respond within 24 hours
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <Phone className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Call Us</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <a 
                  href="tel:+971-4-123-4567" 
                  className="text-primary hover:underline"
                >
                  +971 4 123 4567
                </a>
                <p className="text-sm text-muted-foreground mt-2">
                  Mon-Fri 9am-6pm GST
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="text-center">
                <div className="mx-auto mb-4 h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <MapPin className="h-6 w-6 text-primary" />
                </div>
                <CardTitle className="text-lg">Visit Us</CardTitle>
              </CardHeader>
              <CardContent className="text-center">
                <p className="text-sm">
                  DIFC Innovation Hub<br />
                  Dubai, UAE
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Investor Lead Generation Form */}
          <div className="mb-12">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold mb-3">Interested in Investing?</h2>
              <p className="text-muted-foreground">
                Tell us about your investment goals and we'll help you get started
              </p>
            </div>
            <Card className="max-w-3xl mx-auto border-2 border-primary/20">
              <CardHeader className="bg-primary/5">
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" />
                  Investor Inquiry Form
                </CardTitle>
                <CardDescription>
                  Complete this form and our investment team will contact you within 24 hours
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <InvestorLeadForm />
              </CardContent>
            </Card>
          </div>

          <div className="text-center my-12">
            <div className="inline-flex items-center gap-3 text-muted-foreground">
              <div className="h-px w-20 bg-border" />
              <span>or send us a general message</span>
              <div className="h-px w-20 bg-border" />
            </div>
          </div>

          {/* Contact Form */}
          <Card className="max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle>Send us a Message</CardTitle>
              <CardDescription>
                Fill out the form below and our team will get back to you shortly
              </CardDescription>
            </CardHeader>
            <CardContent>
              {submitted ? (
                <div className="text-center py-8">
                  <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
                    <CheckCircle2 className="h-8 w-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-semibold mb-2">Message Sent!</h3>
                  <p className="text-muted-foreground mb-6">
                    Thank you for contacting us. We'll get back to you as soon as possible.
                  </p>
                  <Button onClick={() => setSubmitted(false)}>
                    Send Another Message
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Full Name *</Label>
                      <Input
                        id="name"
                        name="name"
                        placeholder="John Doe"
                        value={formData.name}
                        onChange={handleChange}
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address *</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        placeholder="john@example.com"
                        value={formData.email}
                        onChange={handleChange}
                        required
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject *</Label>
                    <Input
                      id="subject"
                      name="subject"
                      placeholder="How can we help you?"
                      value={formData.subject}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Message *</Label>
                    <Textarea
                      id="message"
                      name="message"
                      placeholder="Tell us more about your inquiry..."
                      rows={6}
                      value={formData.message}
                      onChange={handleChange}
                      required
                    />
                  </div>

                  <Button 
                    type="submit" 
                    className="w-full" 
                    disabled={contactMutation.isPending}
                  >
                    {contactMutation.isPending ? (
                      <>Sending...</>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Send Message
                      </>
                    )}
                  </Button>
                </form>
              )}
            </CardContent>
          </Card>

          {/* FAQ Section */}
          <div className="mt-16">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Frequently Asked Questions</h2>
              <p className="text-muted-foreground">
                Find answers to common questions about investing with Emtelaak
              </p>
            </div>

            <div className="max-w-3xl mx-auto">
              <Accordion type="single" collapsible className="space-y-4">
                {/* Getting Started */}
                <AccordionItem value="what-is-emtelaak" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold">
                    What is Emtelaak and how does it work?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Emtelaak is a fractional real estate investment platform that allows you to invest in premium properties across MEASA markets starting from just $100. We divide properties into fractions, enabling multiple investors to own shares and earn rental income or capital gains proportional to their investment.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="minimum-investment" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold">
                    What is the minimum investment amount?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    The minimum investment amount is $100 USD. This low barrier to entry allows more people to participate in real estate investment and diversify their portfolio across multiple properties.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="how-to-start" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold">
                    How do I start investing?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Getting started is simple: (1) Create your account and complete KYC verification, (2) Browse available properties and review detailed analytics, (3) Choose your investment amount and distribution frequency, (4) Complete payment and become a fractional owner. You'll start earning returns based on your selected distribution schedule.
                  </AccordionContent>
                </AccordionItem>

                {/* KYC & Verification */}
                <AccordionItem value="kyc-required" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold">
                    Why is KYC verification required?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    KYC (Know Your Customer) verification is required by financial regulations to prevent fraud, money laundering, and ensure platform security. We're licensed by FRA Sandbox and DIFC Innovation License, and compliance with these regulations protects both you and the platform.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="kyc-documents" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold">
                    What documents do I need for KYC verification?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    You'll need a government-issued ID (passport, national ID, or driver's license), proof of address (utility bill or bank statement from the last 3 months), and a selfie for identity verification. Accredited investors may need additional documentation to verify their status.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="kyc-time" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold">
                    How long does KYC verification take?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Most KYC verifications are completed within 24-48 hours. You'll receive real-time notifications about your verification status. Once approved, you can immediately start investing in available properties.
                  </AccordionContent>
                </AccordionItem>

                {/* Investments & Returns */}
                <AccordionItem value="how-earn" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold">
                    How do I earn returns on my investment?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    You earn returns in two ways: (1) Rental Income - Regular distributions from property rental income based on your ownership percentage, and (2) Capital Appreciation - Potential gains when the property value increases or when you sell your shares on the secondary market.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="distribution-frequency" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold">
                    How often are distributions paid?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    You can choose your preferred distribution frequency when investing: monthly, quarterly, or annual. Distributions are automatically deposited to your wallet, and you can track all income history in your portfolio dashboard.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="expected-returns" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold">
                    What are the expected returns?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Target returns vary by property but typically range from 6-8% annual yield from rental income, plus potential capital appreciation. Each property listing includes detailed financial projections, historical performance, and risk assessments to help you make informed decisions.
                  </AccordionContent>
                </AccordionItem>

                {/* Fees & Payments */}
                <AccordionItem value="fees" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold">
                    What fees does Emtelaak charge?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    We charge a transparent fee structure: Platform fee (1-2% of investment amount), Annual management fee (0.5-1% of property value), and Secondary market transaction fee (2-3% on sales). All fees are clearly disclosed before you invest, with no hidden charges.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="payment-methods" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold">
                    What payment methods are accepted?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    We accept bank transfers, credit/debit cards, and digital wallets. All payments are processed through secure, encrypted channels with bank-level security. Your payment information is never stored on our servers.
                  </AccordionContent>
                </AccordionItem>

                {/* Liquidity & Exit */}
                <AccordionItem value="sell-shares" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold">
                    Can I sell my shares before the property is sold?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Yes! Our secondary market allows you to list and sell your shares to other investors. While real estate is traditionally illiquid, our marketplace provides liquidity options. Note that selling price depends on market demand and property performance.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="lock-in-period" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold">
                    Is there a lock-in period for investments?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Most properties have a recommended holding period of 3-5 years for optimal returns, but there's no mandatory lock-in. You can list your shares on the secondary market at any time, subject to market conditions and buyer availability.
                  </AccordionContent>
                </AccordionItem>

                {/* Risk & Security */}
                <AccordionItem value="risks" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold">
                    What are the risks of investing?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Like all investments, fractional real estate carries risks including property value fluctuations, rental income variability, market conditions, and liquidity constraints. We provide comprehensive risk disclosures for each property. Diversifying across multiple properties can help mitigate risk.
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="investment-protection" className="border rounded-lg px-6">
                  <AccordionTrigger className="text-left font-semibold">
                    How is my investment protected?
                  </AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">
                    Your investments are protected through: (1) Regulatory compliance with FRA and DIFC licenses, (2) Legal ownership structure ensuring your fractional ownership rights, (3) Professional property management and insurance, (4) Regular audits and transparent reporting, and (5) Secure platform with bank-level encryption.
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="mt-12 text-center">
                <p className="text-muted-foreground mb-4">
                  Still have questions? We're here to help!
                </p>
                <Button variant="outline" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
                  Contact Our Support Team
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
