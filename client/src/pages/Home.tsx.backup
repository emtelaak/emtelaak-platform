import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { APP_LOGO, APP_TITLE, getLoginUrl, PROPERTY_TYPES, MIN_INVESTMENT_USD } from "@/const";
import { Building2, TrendingUp, Shield, Users, ArrowRight, CheckCircle2 } from "lucide-react";
import { Link } from "wouter";
import NotificationCenter from "@/components/NotificationCenter";
import Footer from "@/components/Footer";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();

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
              Home
            </Link>
            <Link href="/properties" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              Properties
            </Link>
            <Link href="/how-it-works" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              How It Works
            </Link>
            <Link href="/about" className="text-sm font-medium text-foreground hover:text-primary transition-colors">
              About
            </Link>
          </div>

          <div className="flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <NotificationCenter />
                <Link href="/profile">
                  <Button variant="ghost">Profile</Button>
                </Link>
                <Link href="/portfolio">
                  <Button variant="default">Portfolio</Button>
                </Link>
              </>
            ) : (
              <>
                <a href={getLoginUrl()}>
                  <Button variant="ghost">Login</Button>
                </a>
                <a href={getLoginUrl()}>
                  <Button variant="default">Get Started</Button>
                </a>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative py-20 md:py-32 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/5 via-background to-primary/5"></div>
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-foreground">
              Invest in Real Estate Starting from{" "}
              <span className="text-primary">${MIN_INVESTMENT_USD}</span>
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8">
              Democratizing property investment across MEASA markets. Own fractions of premium properties and earn rental income or capital gains.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <Link href="/properties">
                  <Button size="lg" className="text-lg px-8">
                    Browse Properties <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              ) : (
                <a href={getLoginUrl()}>
                  <Button size="lg" className="text-lg px-8">
                    Start Investing Today <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </a>
              )}
              <Link href="/how-it-works">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  Learn More
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Why Choose Emtelaak?</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We make real estate investment accessible, transparent, and profitable for everyone.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="property-card-hover">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Low Minimum Investment</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Start with just ${MIN_INVESTMENT_USD} instead of traditional $150K+ property investments. Diversify across multiple properties.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="property-card-hover">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>High Returns</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Earn 6-18% annual yields from rental income or capital appreciation. Choose between Buy to Let or Buy to Sell strategies.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="property-card-hover">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Shield className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Fully Regulated</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Licensed by FRA Sandbox and DIFC Innovation License. Your investments are secure and compliant with all regulations.
                </CardDescription>
              </CardContent>
            </Card>

            <Card className="property-card-hover">
              <CardHeader>
                <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <CardTitle>Professional Management</CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription>
                  Expert property management, transparent reporting, and hassle-free income distribution directly to your account.
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">How It Works</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Start investing in real estate in four simple steps
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: "1",
                title: "Sign Up & Verify",
                description: "Create your account and complete KYC verification in minutes. We ensure a secure and compliant platform."
              },
              {
                step: "2",
                title: "Browse Properties",
                description: "Explore our curated selection of premium properties across 7 different categories with detailed analytics."
              },
              {
                step: "3",
                title: "Invest & Own",
                description: "Choose your investment amount, select distribution frequency, and own fractional shares of the property."
              },
              {
                step: "4",
                title: "Earn Returns",
                description: "Receive regular rental income or capital gains. Track your portfolio performance in real-time."
              }
            ].map((item) => (
              <div key={item.step} className="relative">
                <div className="flex flex-col items-center text-center">
                  <div className="w-16 h-16 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-2xl font-bold mb-4">
                    {item.step}
                  </div>
                  <h3 className="text-xl font-bold mb-2">{item.title}</h3>
                  <p className="text-muted-foreground">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Property Types */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Investment Categories</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Diversify your portfolio across multiple property types
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {Object.entries(PROPERTY_TYPES).map(([key, value]) => (
              <Card key={key} className="property-card-hover cursor-pointer">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-primary" />
                    {value}
                  </CardTitle>
                </CardHeader>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Trust Indicators */}
      <section className="py-20">
        <div className="container">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Trusted & Secure</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold mb-2">FRA Sandbox Licensed</h3>
              <p className="text-sm text-muted-foreground">
                Regulated by Financial Regulatory Authority
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold mb-2">DIFC Innovation License</h3>
              <p className="text-sm text-muted-foreground">
                Dubai International Financial Centre approved
              </p>
            </div>

            <div className="text-center">
              <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="h-8 w-8 text-primary" />
              </div>
              <h3 className="font-bold mb-2">Bank-Level Security</h3>
              <p className="text-sm text-muted-foreground">
                256-bit encryption and secure payment processing
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-secondary text-secondary-foreground">
        <div className="container">
          <div className="max-w-3xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Ready to Start Your Investment Journey?
            </h2>
            <p className="text-xl mb-8 opacity-90">
              Join thousands of investors building wealth through fractional real estate ownership.
            </p>
            {isAuthenticated ? (
              <Link href="/properties">
                <Button size="lg" variant="default" className="text-lg px-8">
                  Explore Properties <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <a href={getLoginUrl()}>
                <Button size="lg" variant="default" className="text-lg px-8">
                  Get Started Now <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </a>
            )}
          </div>
        </div>
      </section>

      {/* Footer */}
      <Footer />
    </div>
  );
}
