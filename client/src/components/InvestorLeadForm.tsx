import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { CheckCircle2, Loader2 } from "lucide-react";

export function InvestorLeadForm() {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    investmentAmount: "",
    propertyType: "",
    investorType: "",
    timeline: "",
    notes: "",
  });
  const [submitted, setSubmitted] = useState(false);

  const createLeadMutation = trpc.crm.leads.createPublic.useMutation({
    onSuccess: () => {
      setSubmitted(true);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        investmentAmount: "",
        propertyType: "",
        investorType: "",
        timeline: "",
        notes: "",
      });
      toast.success("Thank you! Our investment team will contact you soon.");
    },
    onError: (error) => {
      toast.error(error.message || "Failed to submit inquiry. Please try again.");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.phone) {
      toast.error("Please fill in all required fields");
      return;
    }

    // Create lead in CRM with source "website"
    createLeadMutation.mutate({
      firstName: formData.firstName,
      lastName: formData.lastName,
      email: formData.email,
      phone: formData.phone,
      source: "website",
      investmentInterest: `${formData.propertyType} | ${formData.investmentAmount}`,
      notes: `Investment Interest:
Property Type: ${formData.propertyType || "Not specified"}
Investment Amount: ${formData.investmentAmount || "Not specified"}
Investor Type: ${formData.investorType || "Not specified"}
Timeline: ${formData.timeline || "Not specified"}
Additional Notes: ${formData.notes || "None"}`,
    });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  if (submitted) {
    return (
      <div className="text-center py-8">
        <div className="mx-auto mb-4 h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center">
          <CheckCircle2 className="h-8 w-8 text-primary" />
        </div>
        <h3 className="text-xl font-semibold mb-2">Inquiry Submitted!</h3>
        <p className="text-muted-foreground mb-6">
          Thank you for your interest. Our investment team will review your inquiry and contact you within 24 hours.
        </p>
        <Button onClick={() => setSubmitted(false)}>
          Submit Another Inquiry
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Personal Information</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="firstName">First Name *</Label>
            <Input
              id="firstName"
              name="firstName"
              placeholder="John"
              value={formData.firstName}
              onChange={handleChange}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="lastName">Last Name *</Label>
            <Input
              id="lastName"
              name="lastName"
              placeholder="Doe"
              value={formData.lastName}
              onChange={handleChange}
              required
            />
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="phone">Phone Number *</Label>
            <Input
              id="phone"
              name="phone"
              type="tel"
              placeholder="+971 50 123 4567"
              value={formData.phone}
              onChange={handleChange}
              required
            />
          </div>
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

      {/* Investment Preferences */}
      <div className="space-y-4">
        <h3 className="font-semibold text-lg">Investment Preferences</h3>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="investmentAmount">Investment Amount</Label>
            <Select
              value={formData.investmentAmount}
              onValueChange={(value) => setFormData({ ...formData, investmentAmount: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select amount range" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5k-50k">5,000 - 50,000 EGP</SelectItem>
                <SelectItem value="50k-250k">50,000 - 250,000 EGP</SelectItem>
                <SelectItem value="250k-500k">250,000 - 500,000 EGP</SelectItem>
                <SelectItem value="500k-2m">500,000 - 2,000,000 EGP</SelectItem>
                <SelectItem value="over_2m">Over 2,000,000 EGP</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="propertyType">Property Type Interest</Label>
            <Select
              value={formData.propertyType}
              onValueChange={(value) => setFormData({ ...formData, propertyType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select property type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="residential">Residential</SelectItem>
                <SelectItem value="commercial">Commercial</SelectItem>
                <SelectItem value="medical">Medical</SelectItem>
                <SelectItem value="administrative">Administrative</SelectItem>
                <SelectItem value="educational">Educational</SelectItem>
                <SelectItem value="hotel">Hotel/Hospitality</SelectItem>
                <SelectItem value="mixed">Mixed Portfolio</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="investorType">Investor Type</Label>
            <Select
              value={formData.investorType}
              onValueChange={(value) => setFormData({ ...formData, investorType: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select investor type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="first-time">First-time Investor</SelectItem>
                <SelectItem value="experienced">Experienced Investor</SelectItem>
                <SelectItem value="institutional">Institutional Investor</SelectItem>
                <SelectItem value="high-net-worth">High Net Worth Individual</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="timeline">Investment Timeline</Label>
            <Select
              value={formData.timeline}
              onValueChange={(value) => setFormData({ ...formData, timeline: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="When to invest?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="immediately">Immediately</SelectItem>
                <SelectItem value="1-3-months">Within 1-3 months</SelectItem>
                <SelectItem value="3-6-months">Within 3-6 months</SelectItem>
                <SelectItem value="6-12-months">Within 6-12 months</SelectItem>
                <SelectItem value="researching">Just researching</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Additional Notes */}
      <div className="space-y-2">
        <Label htmlFor="notes">Additional Information (Optional)</Label>
        <Textarea
          id="notes"
          name="notes"
          placeholder="Tell us more about your investment goals or any specific questions you have..."
          rows={4}
          value={formData.notes}
          onChange={handleChange}
        />
      </div>

      <Button
        type="submit"
        className="w-full"
        size="lg"
        disabled={createLeadMutation.isPending}
      >
        {createLeadMutation.isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Submitting...
          </>
        ) : (
          "Submit Inquiry"
        )}
      </Button>

      <p className="text-xs text-center text-muted-foreground">
        By submitting this form, you agree to be contacted by our investment team regarding your inquiry.
      </p>
    </form>
  );
}
