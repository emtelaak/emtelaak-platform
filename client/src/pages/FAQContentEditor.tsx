import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Plus, Trash2, Save } from "lucide-react";

type FAQItem = {
  questionEn: string;
  questionAr: string;
  answerEn: string;
  answerAr: string;
};

export default function FAQContentEditor() {
  const [faqItems, setFaqItems] = useState<FAQItem[]>([
    { questionEn: "", questionAr: "", answerEn: "", answerAr: "" },
  ]);

  // Fetch existing FAQ content
  const { data: content } = trpc.content.get.useQuery({ key: "faq_page" });

  // Update mutation
  const updateMutation = trpc.content.update.useMutation({
    onSuccess: () => {
      toast.success("FAQ content updated successfully");
    },
    onError: (error) => {
      toast.error(`Failed to update content: ${error.message}`);
    },
  });

  // Load existing content
  useEffect(() => {
    if (content?.content) {
      try {
        const parsed = typeof content.content === 'string'
          ? JSON.parse(content.content)
          : content.content;
        if (parsed.faqItems && Array.isArray(parsed.faqItems)) {
          setFaqItems(parsed.faqItems);
        }
      } catch (e) {
        console.error("Failed to parse FAQ content:", e);
      }
    }
  }, [content]);

  const handleAddQuestion = () => {
    setFaqItems([...faqItems, { questionEn: "", questionAr: "", answerEn: "", answerAr: "" }]);
  };

  const handleRemoveQuestion = (index: number) => {
    setFaqItems(faqItems.filter((_, i) => i !== index));
  };

  const handleUpdateQuestion = (index: number, field: keyof FAQItem, value: string) => {
    const updated = [...faqItems];
    updated[index][field] = value;
    setFaqItems(updated);
  };

  const handleSave = () => {
    updateMutation.mutate({
      key: "faq_page",
      content: JSON.stringify({ faqItems }),
    } as any);
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold">FAQ Content Editor</h1>
            <p className="text-muted-foreground mt-2">
              Manage frequently asked questions in English and Arabic
            </p>
          </div>
          <Button onClick={handleSave} disabled={updateMutation.isPending}>
            <Save className="h-4 w-4 mr-2" />
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </Button>
        </div>

        <div className="space-y-6">
          {faqItems.map((item, index) => (
            <Card key={index}>
              <CardHeader>
                <div className="flex justify-between items-center">
                  <CardTitle className="text-lg">Question {index + 1}</CardTitle>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleRemoveQuestion(index)}
                    disabled={faqItems.length === 1}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
                <CardDescription>
                  Provide question and answer in both languages
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  {/* English Question */}
                  <div className="space-y-2">
                    <Label>Question (English)</Label>
                    <Input
                      value={item.questionEn}
                      onChange={(e) => handleUpdateQuestion(index, "questionEn", e.target.value)}
                      placeholder="What is property fractional ownership?"
                    />
                  </div>

                  {/* Arabic Question */}
                  <div className="space-y-2">
                    <Label>Question (Arabic)</Label>
                    <Input
                      value={item.questionAr}
                      onChange={(e) => handleUpdateQuestion(index, "questionAr", e.target.value)}
                      placeholder="ما هي الملكية الجزئية للعقارات؟"
                      dir="rtl"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* English Answer */}
                  <div className="space-y-2">
                    <Label>Answer (English)</Label>
                    <Textarea
                      value={item.answerEn}
                      onChange={(e) => handleUpdateQuestion(index, "answerEn", e.target.value)}
                      placeholder="Fractional ownership allows you to invest in high-value properties..."
                      rows={4}
                    />
                  </div>

                  {/* Arabic Answer */}
                  <div className="space-y-2">
                    <Label>Answer (Arabic)</Label>
                    <Textarea
                      value={item.answerAr}
                      onChange={(e) => handleUpdateQuestion(index, "answerAr", e.target.value)}
                      placeholder="الملكية الجزئية تتيح لك الاستثمار في عقارات عالية القيمة..."
                      rows={4}
                      dir="rtl"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}

          <Button onClick={handleAddQuestion} variant="outline" className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Add Question
          </Button>
        </div>

        <div className="mt-8 p-4 bg-muted rounded-lg">
          <p className="text-sm text-muted-foreground">
            💡 Tip: Keep answers concise and informative. Use clear language that's easy to
            understand for both technical and non-technical users.
          </p>
        </div>
      </div>
    </DashboardLayout>
  );
}
