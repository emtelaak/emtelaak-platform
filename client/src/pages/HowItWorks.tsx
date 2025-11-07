import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle2, UserPlus, Search, DollarSign, TrendingUp, Shield, FileText, Users, Clock, Award } from "lucide-react";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import { APP_LOGO } from "@/const";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";

export default function HowItWorks() {
  const { t, language } = useLanguage();

  const steps = [
    {
      number: "01",
      icon: UserPlus,
      title: t.howItWorks.step1Title,
      description: t.howItWorks.step1Description,
      color: "bg-[#002B49]", // Dark teal
    },
    {
      number: "02",
      icon: Search,
      title: t.howItWorks.step2Title,
      description: t.howItWorks.step2Description,
      color: "bg-[#D4FF00]", // Lime yellow
    },
    {
      number: "03",
      icon: DollarSign,
      title: t.howItWorks.step3Title,
      description: t.howItWorks.step3Description,
      color: "bg-[#00A86B]", // Dark green
    },
    {
      number: "04",
      icon: TrendingUp,
      title: t.howItWorks.step4Title,
      description: t.howItWorks.step4Description,
      color: "bg-[#FF6B35]", // Orange
    },
  ];

  const services = [
    {
      icon: Shield,
      title: t.howItWorks.service1Title,
      description: t.howItWorks.service1Description,
    },
    {
      icon: FileText,
      title: t.howItWorks.service2Title,
      description: t.howItWorks.service2Description,
    },
    {
      icon: Users,
      title: t.howItWorks.service3Title,
      description: t.howItWorks.service3Description,
    },
    {
      icon: Clock,
      title: t.howItWorks.service4Title,
      description: t.howItWorks.service4Description,
    },
    {
      icon: TrendingUp,
      title: t.howItWorks.service5Title,
      description: t.howItWorks.service5Description,
    },
    {
      icon: Award,
      title: t.howItWorks.service6Title,
      description: t.howItWorks.service6Description,
    },
  ];

  const benefits = [
    t.howItWorks.benefit1,
    t.howItWorks.benefit2,
    t.howItWorks.benefit3,
    t.howItWorks.benefit4,
    t.howItWorks.benefit5,
    t.howItWorks.benefit6,
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
            <Link href="/contact" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t.nav.contact}
            </Link>
            <Link href="/faq" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              {t.nav.faq}
            </Link>
          </div>
          
          <div className="flex items-center gap-4">
            <LanguageSwitcher />
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative h-[400px] flex items-center justify-center text-white">
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage: "url('https://images.unsplash.com/photo-1560518883-ce09059eeffa?w=1200')",
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-[#002B49]/90 to-[#002B49]/70" />
        </div>
        <div className="relative z-10 text-center px-4">
          <h1 className="text-5xl md:text-6xl font-bold mb-4">
            {t.howItWorks.heroTitle}
          </h1>
          <p className="text-xl md:text-2xl text-white/90 max-w-3xl mx-auto">
            {t.howItWorks.heroSubtitle}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="flex-1">
        {/* Investment Process Steps */}
        <section className="py-20 bg-background">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">{t.howItWorks.processTitle}</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t.howItWorks.processSubtitle}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {steps.map((step, index) => {
                const Icon = step.icon;
                const isLightBg = step.color === "bg-[#D4FF00]";
                return (
                  <Card
                    key={index}
                    className={`${step.color} border-none text-${isLightBg ? "gray-900" : "white"} hover:scale-105 transition-transform`}
                  >
                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <span className={`text-5xl font-bold ${isLightBg ? "text-gray-900/30" : "text-white/30"}`}>
                          {step.number}
                        </span>
                        <Icon className={`h-10 w-10 ${isLightBg ? "text-gray-900" : "text-white"}`} />
                      </div>
                      <CardTitle className={`text-2xl ${isLightBg ? "text-gray-900" : "text-white"}`}>
                        {step.title}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className={`${isLightBg ? "text-gray-700" : "text-white/90"}`}>
                        {step.description}
                      </p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Services Section */}
        <section className="py-20 bg-muted/30">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">{t.howItWorks.servicesTitle}</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t.howItWorks.servicesSubtitle}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {services.map((service, index) => {
                const Icon = service.icon;
                return (
                  <Card key={index} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="mb-4 h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                        <Icon className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-xl">{service.title}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-muted-foreground">{service.description}</p>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="py-20 bg-background">
          <div className="container">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-bold mb-4">{t.howItWorks.benefitsTitle}</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                {t.howItWorks.benefitsSubtitle}
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-5xl mx-auto">
              {benefits.map((benefit, index) => (
                <div
                  key={index}
                  className="flex items-start gap-3 p-6 rounded-lg bg-muted/50 hover:bg-muted transition-colors"
                >
                  <CheckCircle2 className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                  <p className="text-lg">{benefit}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20 bg-[#002B49] text-white">
          <div className="container text-center">
            <h2 className="text-4xl font-bold mb-6">
              {t.howItWorks.ctaTitle}
            </h2>
            <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
              {t.howItWorks.ctaSubtitle}
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/properties">
                <Button size="lg" className="bg-[#D4FF00] text-gray-900 hover:bg-[#D4FF00]/90">
                  {t.howItWorks.ctaBrowse}
                </Button>
              </Link>
              <Link href="/contact">
                <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                  {t.howItWorks.ctaContact}
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
}
