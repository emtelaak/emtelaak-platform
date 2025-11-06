import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl } from "@/const";
import { Building2, TrendingUp, Shield, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import NotificationCenter from "@/components/NotificationCenter";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import ROICalculator from "@/components/ROICalculator";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const { t, language } = useLanguage();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <div className="flex items-center gap-3">
            <img src={APP_LOGO} alt={APP_TITLE} className="h-10 w-auto" />
          </div>
          
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
          </div>

          <div className="flex items-center gap-3">
            <LanguageSwitcher />
            {isAuthenticated ? (
              <>
                <NotificationCenter />
                <Link href="/profile">
                  <Button variant="ghost">{t.nav.profile}</Button>
                </Link>
              </>
            ) : (
              <>
                <a href={getLoginUrl()}>
                  <Button variant="ghost">{t.nav.login}</Button>
                </a>
                <a href={getLoginUrl()}>
                  <Button>{t.nav.getStarted}</Button>
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-background to-muted/20 py-20 md:py-32">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight sm:text-6xl mb-6">
              {t.home.hero.title}
              <br />
              <span className="text-primary">{t.home.hero.subtitle} {t.home.hero.amount}</span>
            </h1>
            <p className="text-lg text-muted-foreground mb-8 max-w-2xl mx-auto">
              {t.home.hero.description}
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a href={getLoginUrl()}>
                <Button size="lg" className="gap-2">
                  {t.home.hero.startInvesting} <ArrowRight className="h-4 w-4" />
                </Button>
              </a>
              <Link href="/how-it-works">
                <Button size="lg" variant="outline">{t.home.hero.learnMore}</Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Emtelaak */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t.home.whyChoose.title}</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              {t.home.whyChoose.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card>
              <CardHeader>
                <Building2 className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{t.home.whyChoose.lowMinimum.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t.home.whyChoose.lowMinimum.description}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <TrendingUp className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{t.home.whyChoose.highReturns.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t.home.whyChoose.highReturns.description}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Shield className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{t.home.whyChoose.fullyRegulated.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t.home.whyChoose.fullyRegulated.description}
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <Users className="h-10 w-10 text-primary mb-2" />
                <CardTitle>{t.home.whyChoose.professionalManagement.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">
                  {t.home.whyChoose.professionalManagement.description}
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t.home.howItWorks.title}</h2>
            <p className="text-muted-foreground">
              {t.home.howItWorks.subtitle}
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { num: "1", ...t.home.howItWorks.step1 },
              { num: "2", ...t.home.howItWorks.step2 },
              { num: "3", ...t.home.howItWorks.step3 },
              { num: "4", ...t.home.howItWorks.step4 },
            ].map((step) => (
              <div key={step.num} className="text-center">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-xl mb-4">
                  {step.num}
                </div>
                <h3 className="font-semibold mb-2">{step.title}</h3>
                <p className="text-sm text-muted-foreground">{step.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Categories */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t.home.categories.title}</h2>
            <p className="text-muted-foreground">
              {t.home.categories.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              t.home.categories.residential,
              t.home.categories.commercial,
              t.home.categories.administrative,
              t.home.categories.hospitality,
              t.home.categories.education,
              t.home.categories.logistics,
              t.home.categories.medical,
            ].map((category) => (
              <Card key={category} className="hover:border-primary transition-colors cursor-pointer">
                <CardHeader>
                  <CardTitle className="text-sm flex items-center gap-2">
                    <div className="h-2 w-2 rounded-full bg-primary" />
                    {category}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ROI Calculator */}
      <section className="py-20 bg-background">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">
              {language === "en" ? "Calculate Your Returns" : "احسب عوائدك"}
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              {language === "en"
                ? "Compare potential returns across different property types and see how your investment can grow over time."
                : "قارن العوائد المحتملة عبر أنواع العقارات المختلفة وشاهد كيف يمكن لاستثمارك أن ينمو بمرور الوقت."}
            </p>
          </div>
          <ROICalculator compact />
        </div>
      </section>

      {/* Trust & Security */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold">{t.home.trust.title}</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{t.home.trust.fra.title}</h3>
              <p className="text-sm text-muted-foreground">{t.home.trust.fra.description}</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{t.home.trust.difc.title}</h3>
              <p className="text-sm text-muted-foreground">{t.home.trust.difc.description}</p>
            </div>

            <div className="text-center">
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-semibold mb-2">{t.home.trust.security.title}</h3>
              <p className="text-sm text-muted-foreground">{t.home.trust.security.description}</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary text-secondary-foreground">
        <div className="container text-center">
          <h2 className="text-3xl font-bold mb-4">{t.home.cta.title}</h2>
          <p className="text-lg mb-8 max-w-2xl mx-auto opacity-90">
            {t.home.cta.subtitle}
          </p>
          <a href={getLoginUrl()}>
            <Button size="lg" variant="default" className="gap-2">
              {t.home.cta.button} <ArrowRight className="h-4 w-4" />
            </Button>
          </a>
        </div>
      </section>

      <Footer />
    </div>
  );
}
