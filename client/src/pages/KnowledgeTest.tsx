import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { toast } from "sonner";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { APP_LOGO, APP_TITLE } from "@/const";
import { useLanguage } from "@/contexts/LanguageContext";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { 
  CheckCircle2, 
  AlertCircle, 
  Clock, 
  Award, 
  BookOpen,
  ArrowRight,
  ArrowLeft,
  FileCheck
} from "lucide-react";
import { Breadcrumb } from "@/components/Breadcrumb";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface Question {
  id: number;
  questionText: string;
  questionTextAr?: string;
  category: string;
  difficulty: string;
  answers: Answer[];
}

interface Answer {
  id: number;
  answerText: string;
  answerTextAr?: string;
}

export default function KnowledgeTest() {
  const { user, isAuthenticated, loading: authLoading } = useAuth();
  const { t, language, dir } = useLanguage();
  const isRTL = dir === 'rtl';
  const [, setLocation] = useLocation();

  const [testStarted, setTestStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [testCompleted, setTestCompleted] = useState(false);
  const [testResult, setTestResult] = useState<any>(null);

  // Check if user already has a valid certificate
  const { data: certificate, isLoading: certificateLoading } = trpc.knowledgeTest.getCertificate.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Get test history
  const { data: testHistory, isLoading: historyLoading } = trpc.knowledgeTest.getTestHistory.useQuery(
    undefined,
    { enabled: isAuthenticated }
  );

  // Start test query
  const { data: testData, isLoading: testLoading, refetch: startTest } = trpc.knowledgeTest.startTest.useQuery(
    { numberOfQuestions: 20 },
    { enabled: false }
  );

  // Submit test mutation
  const submitTestMutation = trpc.knowledgeTest.submitTest.useMutation({
    onSuccess: (result) => {
      setTestResult(result);
      setTestCompleted(true);
      
      if (result.passed) {
        toast.success("Congratulations! 🎉", {
          description: `You passed the test with a score of ${result.score}%. Certificate ID: ${result.certificateId}`,
        });
      } else {
        toast.error("Test Not Passed", {
          description: `You scored ${result.score}%. You need 70% to pass. Please try again.`,
        });
      }
    },
    onError: (error) => {
      toast.error("Error", {
        description: error.message,
      });
    },
  });

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      setLocation("/login");
    }
  }, [authLoading, isAuthenticated, setLocation]);

  if (authLoading || certificateLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <Clock className="h-8 w-8 animate-spin mx-auto mb-4" />
          <p>Loading...</p>
        </div>
      </div>
    );
  }

  const handleStartTest = async () => {
    await startTest();
    setTestStarted(true);
    setCurrentQuestionIndex(0);
    setSelectedAnswers({});
    setTestCompleted(false);
    setTestResult(null);
  };

  const handleAnswerSelect = (questionId: number, answerId: number) => {
    setSelectedAnswers(prev => ({
      ...prev,
      [questionId]: answerId,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < (testData?.questions.length || 0) - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const handleSubmitTest = () => {
    if (Object.keys(selectedAnswers).length < (testData?.questions.length || 0)) {
      toast.error("Incomplete Test", {
        description: "Please answer all questions before submitting.",
      });
      return;
    }

    const responses = Object.entries(selectedAnswers).map(([questionId, answerId]) => ({
      questionId: parseInt(questionId),
      selectedAnswerId: answerId,
    }));

    submitTestMutation.mutate({ responses });
  };

  const calculateProgress = () => {
    const totalQuestions = testData?.questions.length || 0;
    const answeredQuestions = Object.keys(selectedAnswers).length;
    return (answeredQuestions / totalQuestions) * 100;
  };

  const currentQuestion = testData?.questions[currentQuestionIndex];

  // Certificate View
  if (certificate && !testStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <Breadcrumb
            items={[
              { label: t.nav?.home || "Home", href: "/" },
              { label: "Knowledge Test", href: "/knowledge-test" },
            ]}
          />

          <div className="max-w-3xl mx-auto mt-8">
            <Card className="border-2 border-green-500">
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  <Award className="h-16 w-16 text-green-500" />
                </div>
                <CardTitle className="text-2xl">Valid Certificate</CardTitle>
                <CardDescription>
                  You have successfully completed the investment knowledge test
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-green-50 dark:bg-green-900/20 p-6 rounded-lg text-center">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Certificate ID</p>
                  <p className="text-2xl font-bold text-green-600 dark:text-green-400 mb-4">
                    {certificate.certificateId}
                  </p>
                  
                  <div className="grid grid-cols-2 gap-4 mt-4">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Score</p>
                      <p className="text-xl font-semibold">{certificate.score}%</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Status</p>
                      <Badge className="bg-green-500">Passed</Badge>
                    </div>
                  </div>

                  <div className="mt-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">Completed On</p>
                    <p className="font-medium">
                      {new Date(certificate.attemptedAt).toLocaleDateString()}
                    </p>
                  </div>

                  {certificate.expiresAt && (
                    <div className="mt-4">
                      <p className="text-sm text-gray-600 dark:text-gray-400">Expires On</p>
                      <p className="font-medium">
                        {new Date(certificate.expiresAt).toLocaleDateString()}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-center gap-4 mt-6">
                  <Button onClick={() => setLocation("/profile")}>
                    Go to Profile
                  </Button>
                  <Button variant="outline" onClick={handleStartTest}>
                    Retake Test
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Test Result View
  if (testCompleted && testResult) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            <Card className={`border-2 ${testResult.passed ? 'border-green-500' : 'border-red-500'}`}>
              <CardHeader className="text-center">
                <div className="flex justify-center mb-4">
                  {testResult.passed ? (
                    <CheckCircle2 className="h-16 w-16 text-green-500" />
                  ) : (
                    <AlertCircle className="h-16 w-16 text-red-500" />
                  )}
                </div>
                <CardTitle className="text-2xl">
                  {testResult.passed ? "Congratulations!" : "Test Not Passed"}
                </CardTitle>
                <CardDescription>
                  {testResult.passed 
                    ? "You have successfully passed the investment knowledge test"
                    : "You need 70% to pass. Please review the material and try again."
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className={`${testResult.passed ? 'bg-green-50 dark:bg-green-900/20' : 'bg-red-50 dark:bg-red-900/20'} p-6 rounded-lg`}>
                  <div className="text-center mb-4">
                    <p className="text-4xl font-bold mb-2">{testResult.score}%</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {testResult.correctAnswers} out of {testResult.totalQuestions} correct
                    </p>
                  </div>

                  {testResult.passed && testResult.certificateId && (
                    <div className="mt-4 text-center">
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">Certificate ID</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        {testResult.certificateId}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex justify-center gap-4 mt-6">
                  {testResult.passed ? (
                    <Button onClick={() => setLocation("/profile")}>
                      Go to Profile
                    </Button>
                  ) : (
                    <>
                      <Button onClick={handleStartTest}>
                        Try Again
                      </Button>
                      <Button variant="outline" onClick={() => setLocation("/")}>
                        Back to Home
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Test Taking View
  if (testStarted && testData && currentQuestion) {
    const progress = ((currentQuestionIndex + 1) / testData.questions.length) * 100;
    const isLastQuestion = currentQuestionIndex === testData.questions.length - 1;
    const isAnswered = selectedAnswers[currentQuestion.id] !== undefined;

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-3xl mx-auto">
            {/* Progress Bar */}
            <Card className="mb-6">
              <CardContent className="pt-6">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">
                    Question {currentQuestionIndex + 1} of {testData.questions.length}
                  </span>
                  <Badge variant={isAnswered ? "default" : "secondary"}>
                    {Object.keys(selectedAnswers).length} / {testData.questions.length} Answered
                  </Badge>
                </div>
                <Progress value={progress} className="h-2" />
              </CardContent>
            </Card>

            {/* Question Card */}
            <Card>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <Badge className="mb-2">{currentQuestion.category}</Badge>
                    <CardTitle className="text-xl mt-2">
                      {language === 'ar' && currentQuestion.questionTextAr 
                        ? currentQuestion.questionTextAr 
                        : currentQuestion.questionText}
                    </CardTitle>
                  </div>
                  <Badge variant="outline" className="ml-4">
                    {currentQuestion.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <RadioGroup
                  value={selectedAnswers[currentQuestion.id]?.toString()}
                  onValueChange={(value) => handleAnswerSelect(currentQuestion.id, parseInt(value))}
                >
                  <div className="space-y-3">
                    {currentQuestion.answers.map((answer) => (
                      <div
                        key={answer.id}
                        className={`flex items-center space-x-3 p-4 rounded-lg border-2 transition-all cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800 ${
                          selectedAnswers[currentQuestion.id] === answer.id
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700'
                        }`}
                        onClick={() => handleAnswerSelect(currentQuestion.id, answer.id)}
                      >
                        <RadioGroupItem value={answer.id.toString()} id={`answer-${answer.id}`} />
                        <Label
                          htmlFor={`answer-${answer.id}`}
                          className="flex-1 cursor-pointer"
                        >
                          {language === 'ar' && answer.answerTextAr 
                            ? answer.answerTextAr 
                            : answer.answerText}
                        </Label>
                      </div>
                    ))}
                  </div>
                </RadioGroup>

                {/* Navigation Buttons */}
                <div className="flex justify-between mt-8">
                  <Button
                    variant="outline"
                    onClick={handlePrevious}
                    disabled={currentQuestionIndex === 0}
                  >
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Previous
                  </Button>

                  {isLastQuestion ? (
                    <Button
                      onClick={handleSubmitTest}
                      disabled={submitTestMutation.isPending}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {submitTestMutation.isPending ? (
                        <>
                          <Clock className="h-4 w-4 mr-2 animate-spin" />
                          Submitting...
                        </>
                      ) : (
                        <>
                          <FileCheck className="h-4 w-4 mr-2" />
                          Submit Test
                        </>
                      )}
                    </Button>
                  ) : (
                    <Button onClick={handleNext}>
                      Next
                      <ArrowRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Question Navigator */}
            <Card className="mt-6">
              <CardHeader>
                <CardTitle className="text-sm">Question Navigator</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-10 gap-2">
                  {testData.questions.map((q, index) => (
                    <Button
                      key={q.id}
                      variant={index === currentQuestionIndex ? "default" : "outline"}
                      size="sm"
                      className={`${
                        selectedAnswers[q.id] !== undefined
                          ? 'bg-green-100 dark:bg-green-900/30 border-green-500'
                          : ''
                      }`}
                      onClick={() => setCurrentQuestionIndex(index)}
                    >
                      {index + 1}
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Welcome/Start Test View
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800">
      <div className="container mx-auto px-4 py-8">
        <Breadcrumb
          items={[
            { label: t.nav?.home || "Home", href: "/" },
            { label: "Knowledge Test", href: "/knowledge-test" },
          ]}
        />

        <div className="max-w-3xl mx-auto mt-8">
          <Card>
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <BookOpen className="h-16 w-16 text-blue-500" />
              </div>
              <CardTitle className="text-3xl">Investment Knowledge Test</CardTitle>
              <CardDescription className="text-lg mt-2">
                Complete this test to qualify as an investor on our platform
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Test Requirements</AlertTitle>
                <AlertDescription>
                  This test is required by the Financial Regulatory Authority (FRA) to ensure
                  investors have adequate knowledge before investing in real estate crowdfunding.
                </AlertDescription>
              </Alert>

              <div className="space-y-4">
                <h3 className="font-semibold text-lg">Test Details:</h3>
                <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>20 questions</strong> covering investment fundamentals, risk management, and real estate basics</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>70% passing score</strong> required</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>No time limit</strong> - take your time to answer carefully</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>Certificate valid for 2 years</strong> upon passing</span>
                  </li>
                  <li className="flex items-start">
                    <CheckCircle2 className="h-5 w-5 text-green-500 mr-2 flex-shrink-0 mt-0.5" />
                    <span><strong>Unlimited attempts</strong> if you don't pass on the first try</span>
                  </li>
                </ul>
              </div>

              {testHistory && testHistory.length > 0 && (
                <div className="mt-6">
                  <h3 className="font-semibold text-lg mb-3">Previous Attempts:</h3>
                  <div className="space-y-2">
                    {testHistory.slice(0, 3).map((attempt) => (
                      <div
                        key={attempt.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
                      >
                        <div className="flex items-center gap-3">
                          {attempt.passed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-red-500" />
                          )}
                          <div>
                            <p className="font-medium">Score: {attempt.score}%</p>
                            <p className="text-sm text-gray-600 dark:text-gray-400">
                              {new Date(attempt.attemptedAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <Badge variant={attempt.passed ? "default" : "destructive"}>
                          {attempt.passed ? "Passed" : "Failed"}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-center gap-4 mt-8">
                <Button
                  size="lg"
                  onClick={handleStartTest}
                  disabled={testLoading}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {testLoading ? (
                    <>
                      <Clock className="h-5 w-5 mr-2 animate-spin" />
                      Loading Test...
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-5 w-5 mr-2" />
                      Start Test
                    </>
                  )}
                </Button>
                <Button variant="outline" size="lg" onClick={() => setLocation("/")}>
                  Back to Home
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
