import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { APP_LOGO } from "@/const";
import { Link } from "wouter";
import Footer from "@/components/Footer";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Building2, Shield, TrendingUp, Users, CheckCircle2, Target, Eye } from "lucide-react";

export default function About() {
  const { isAuthenticated } = useAuth();
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex flex-col">
      {/* Navigation */}
      <nav className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between">
          <Link href="/">
            <img src={APP_LOGO} alt="Emtelaak" className="h-10 w-auto cursor-pointer" />
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
            <Link href="/about" className="text-sm font-medium text-primary transition-colors">
              {t.nav.about}
            </Link>
            <Link href="/faq" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
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
              {t.about.title}
            </h1>
            <p className="text-lg text-muted-foreground">
              {t.about.subtitle}
            </p>
          </div>
        </div>
      </section>

      {/* Our Story Section */}
      <section className="py-16 bg-background">
        <div className="container max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t.about.ourStory.title}</h2>
          </div>
          <div className="prose prose-lg max-w-none text-center mb-12">
            <p className="text-muted-foreground leading-relaxed">
              {t.about.ourStory.description}
            </p>
          </div>

          {/* Value Propositions Grid */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mt-12">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{t.about.values.pioneer.title}</h3>
                <p className="text-sm text-muted-foreground">{t.about.values.pioneer.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{t.about.values.accessibility.title}</h3>
                <p className="text-sm text-muted-foreground">{t.about.values.accessibility.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{t.about.values.diverse.title}</h3>
                <p className="text-sm text-muted-foreground">{t.about.values.diverse.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{t.about.values.fullService.title}</h3>
                <p className="text-sm text-muted-foreground">{t.about.values.fullService.description}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Mission & Vision Section */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-5xl">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Target className="h-6 w-6 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold">{t.about.mission.title}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {t.about.mission.description}
              </p>
            </div>

            <div>
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                  <Eye className="h-6 w-6 text-primary-foreground" />
                </div>
                <h2 className="text-2xl font-bold">{t.about.vision.title}</h2>
              </div>
              <p className="text-muted-foreground leading-relaxed">
                {t.about.vision.description}
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Regulatory Compliance Section */}
      <section className="py-16 bg-background">
        <div className="container max-w-5xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t.about.compliance.title}</h2>
            <p className="text-muted-foreground">{t.about.compliance.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{t.about.compliance.fra.title}</h3>
                <p className="text-sm text-muted-foreground">{t.about.compliance.fra.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{t.about.compliance.difc.title}</h3>
                <p className="text-sm text-muted-foreground">{t.about.compliance.difc.description}</p>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6 text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Shield className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">{t.about.compliance.security.title}</h3>
                <p className="text-sm text-muted-foreground">{t.about.compliance.security.description}</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Team Section */}
      <section className="py-16 bg-muted/30">
        <div className="container max-w-6xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">{t.about.team.title}</h2>
            <p className="text-muted-foreground">{t.about.team.subtitle}</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {t.about.team.members.map((member: any, index: number) => (
              <Card key={index} className="overflow-hidden">
                <CardContent className="p-0">
                  <div className="aspect-square bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <div className="w-32 h-32 rounded-full bg-primary/10 flex items-center justify-center">
                      <Users className="h-16 w-16 text-primary" />
                    </div>
                  </div>
                  <div className="p-6">
                    <h3 className="text-xl font-bold mb-1">{member.name}</h3>
                    <p className="text-primary font-medium mb-3">{member.title}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{member.bio}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-b from-primary/5 to-background">
        <div className="container max-w-3xl text-center">
          <h2 className="text-3xl font-bold mb-4">{t.about.cta.title}</h2>
          <p className="text-muted-foreground mb-8">{t.about.cta.description}</p>
          <div className="flex flex-wrap gap-4 justify-center">
            <Link href="/properties">
              <Button size="lg">{t.about.cta.browseProperties}</Button>
            </Link>
            <Link href="/contact">
              <Button size="lg" variant="outline">{t.about.cta.contactUs}</Button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
