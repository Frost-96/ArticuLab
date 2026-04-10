"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { useAppStore } from "@/store/appStore";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, Copy, Download, TrendingUp } from "lucide-react";

export default function Page() {
  const router = useRouter();
  const mockEssay = `In recent years, technology has become an integral part of our daily lives. Some people believe that this has made our lives more complex, while others argue that it has simplified many aspects of living. In my opinion, although technology has introduced some new challenges, it has overall made our lives easier and more convenient.

    Firstly, technology has revolutionized the way we communicate. In the past, sending a letter could take days or even weeks, but now we can instantly connect with anyone around the world through email, messaging apps, or video calls. This has made it easier for people to stay in touch with family and friends, regardless of geographical distance. Furthermore, social media platforms have enabled us to build and maintain broader networks of relationships.

    Secondly, technology has greatly improved access to information and education. The internet provides a vast repository of knowledge that is available at our fingertips. Students can now access online courses, tutorials, and educational resources from prestigious universities around the world. This democratization of knowledge has made quality education more accessible to people regardless of their socioeconomic background or location.

    However, it would be remiss to ignore the potential downsides of technology. The constant connectivity can lead to information overload and decreased attention spans. Many people find themselves constantly checking their phones, which can be distracting and reduce productivity. Additionally, there are concerns about privacy and the security of personal data in an increasingly digital world.

    In conclusion, while technology has certainly brought about new challenges, I believe its benefits far outweigh the drawbacks. The key is to use technology mindfully and maintain a healthy balance between our digital and offline lives. As with any tool, the impact of technology depends largely on how we choose to use it.`;

  const subScores = [
    {
      name: "Grammar",
      score: 7.5,
      maxScore: 9,
      comment: "Good control of grammar with minor errors",
    },
    {
      name: "Vocabulary",
      score: 7.0,
      maxScore: 9,
      comment: "Good range, could use more academic words",
    },
    {
      name: "Coherence",
      score: 8.0,
      maxScore: 9,
      comment: "Well-organized with clear progression",
    },
    {
      name: "Task Response",
      score: 7.0,
      maxScore: 9,
      comment: "Addresses all parts of the question",
    },
  ];

  const improvements = [
    {
      category: "Vocabulary Enhancement",
      suggestions: [
        {
          original: "made our lives easier",
          improved: "enhanced our quality of life",
          type: "upgrade",
        },
        {
          original: "very important",
          improved: "paramount/crucial",
          type: "upgrade",
        },
        {
          original: "good example",
          improved: "compelling illustration",
          type: "upgrade",
        },
      ],
    },
    {
      category: "Grammar Corrections",
      suggestions: [
        {
          original: "there is many people",
          improved: "there are many people",
          type: "error",
        },
        {
          original: "different than",
          improved: "different from",
          type: "error",
        },
      ],
    },
    {
      category: "Style Tips",
      suggestions: [
        {
          original: "I think that",
          improved: "Consider removing for more formal tone",
          type: "tip",
        },
        {
          original: "a lot of",
          improved: "numerous/substantial",
          type: "tip",
        },
      ],
    },
  ];

  // Score Row Component
  const { currentWritingSession } = useAppStore();
  const overallScore = 7.5;
  const essay = currentWritingSession?.content || mockEssay;

  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-emerald-600";
    if (score >= 7) return "text-indigo-600";
    if (score >= 6) return "text-amber-600";
    return "text-red-600";
  };

  const getScoreBg = (score: number) => {
    if (score >= 8) return "bg-emerald-100";
    if (score >= 7) return "bg-indigo-100";
    if (score >= 6) return "bg-amber-100";
    return "bg-red-100";
  };

  const renderAnnotatedEssay = () => {
    // Split essay into paragraphs and add annotations
    const paragraphs = essay.split("\n\n");
    return paragraphs.map((paragraph, pIndex) => (
      <div key={pIndex} className="mb-4">
        <p className="text-slate-700 leading-relaxed">
          {pIndex === 0 && (
            <>
              In recent years, technology has{" "}
              <span
                className="bg-emerald-100 text-emerald-700 px-1 rounded cursor-help"
                title="Correct usage"
              >
                become
              </span>{" "}
              an{" "}
              <span
                className="bg-blue-100 text-blue-700 px-1 rounded cursor-help"
                title="Tip: Consider 'essential component'"
              >
                integral
              </span>{" "}
              part of our daily lives. Some people believe that this has made
              our lives more complex, while others argue that it has simplified
              many aspects of living.{" "}
              <span
                className="bg-yellow-100 text-yellow-700 px-1 rounded cursor-help"
                title="Suggestion: 'From my perspective' for variety"
              >
                In my opinion
              </span>
              , although technology has introduced some new challenges, it has
              overall made our lives easier and more convenient.
            </>
          )}
          {pIndex === 1 && (
            <>
              Firstly, technology has{" "}
              <span
                className="bg-blue-100 text-blue-700 px-1 rounded cursor-help"
                title="Tip: 'fundamentally transformed'"
              >
                revolutionized
              </span>{" "}
              the way we communicate. In the past, sending a letter could take
              days or even weeks, but now we can instantly connect with anyone
              around the world through email, messaging apps, or video calls.
              This has made it easier for people to stay in touch with family
              and friends, regardless of geographical distance. Furthermore,
              social media platforms have enabled us to build and maintain
              broader networks of relationships.
            </>
          )}
          {pIndex === 2 && (
            <>
              Secondly, technology has greatly improved access to information
              and education. The internet provides a{" "}
              <span
                className="bg-yellow-100 text-yellow-700 px-1 rounded cursor-help"
                title="Suggestion: 'extensive' or 'comprehensive'"
              >
                vast
              </span>{" "}
              repository of knowledge that is available at our fingertips.
              Students can now access online courses, tutorials, and educational
              resources from prestigious universities around the world. This
              democratization of knowledge has made quality education more
              accessible to people regardless of their socioeconomic background
              or location.
            </>
          )}
          {pIndex === 3 && (
            <>
              However, it would be{" "}
              <span
                className="bg-blue-100 text-blue-700 px-1 rounded cursor-help"
                title="Tip: Great use of formal vocabulary!"
              >
                remiss
              </span>{" "}
              to ignore the potential downsides of technology. The constant
              connectivity can lead to information overload and decreased
              attention spans. Many people find themselves constantly checking
              their phones, which can be distracting and reduce productivity.
              Additionally,{" "}
              <span
                className="bg-emerald-100 text-emerald-700 px-1 rounded cursor-help"
                title="Correct usage"
              >
                there are
              </span>{" "}
              concerns about privacy and the security of personal data in an
              increasingly digital world.
            </>
          )}
          {pIndex === 4 && paragraph}
        </p>
      </div>
    ));
  };

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => router.push("/writing")}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
          <div>
            <h1 className="text-2xl font-semibold text-slate-900">
              Writing Review
            </h1>
            <p className="text-slate-500 mt-1">
              IELTS Task 2 - Technology Essay
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline">
            <Copy className="h-4 w-4 mr-2" />
            Copy
          </Button>
          <Button variant="outline">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Score Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Overall Score */}
        <Card className="lg:col-span-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500">
                  Overall Band Score
                </p>
                <div className="flex items-baseline gap-2 mt-2">
                  <span
                    className={cn(
                      "text-5xl font-bold",
                      getScoreColor(overallScore),
                    )}
                  >
                    {overallScore}
                  </span>
                  <span className="text-slate-400">/ 9.0</span>
                </div>
                <p className="text-sm text-slate-600 mt-2">
                  Good - Competent User
                </p>
              </div>
              <div
                className={cn(
                  "h-24 w-24 rounded-full flex items-center justify-center",
                  getScoreBg(overallScore),
                )}
              >
                <div className="text-center">
                  <span
                    className={cn(
                      "text-2xl font-bold",
                      getScoreColor(overallScore),
                    )}
                  >
                    {overallScore}
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sub-scores */}
        <Card className="lg:col-span-3">
          <CardContent className="p-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {subScores.map((item) => (
                <div key={item.name} className="text-center">
                  <div
                    className={cn(
                      "h-16 w-16 rounded-full mx-auto flex items-center justify-center mb-2",
                      getScoreBg(item.score),
                    )}
                  >
                    <span
                      className={cn(
                        "text-xl font-bold",
                        getScoreColor(item.score),
                      )}
                    >
                      {item.score}
                    </span>
                  </div>
                  <p className="text-sm font-medium text-slate-900">
                    {item.name}
                  </p>
                  <p className="text-xs text-slate-500 mt-1">{item.comment}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Essay with Annotations */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Your Essay</CardTitle>
                <div className="flex items-center gap-3 text-xs">
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded bg-red-100 border border-red-200" />
                    Errors
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded bg-yellow-100 border border-yellow-200" />
                    Suggestions
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="h-3 w-3 rounded bg-blue-100 border border-blue-200" />
                    Tips
                  </span>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="prose prose-slate max-w-none">
                {renderAnnotatedEssay()}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Improvement Panel */}
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-indigo-600" />
                Improvement Suggestions
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {improvements.map((category, index) => (
                <div key={index}>
                  <h4 className="text-sm font-medium text-slate-900 mb-3">
                    {category.category}
                  </h4>
                  <div className="space-y-2">
                    {category.suggestions.map((suggestion, sIndex) => (
                      <div
                        key={sIndex}
                        className={cn(
                          "p-3 rounded-lg border",
                          suggestion.type === "error"
                            ? "bg-red-50 border-red-200"
                            : suggestion.type === "upgrade"
                              ? "bg-emerald-50 border-emerald-200"
                              : "bg-blue-50 border-blue-200",
                        )}
                      >
                        <p className="text-sm">
                          <span className="text-slate-500">Replace:</span>{" "}
                          <span
                            className={cn(
                              "font-medium",
                              suggestion.type === "error"
                                ? "text-red-700"
                                : "text-slate-700",
                            )}
                          >
                            "{suggestion.original}"
                          </span>
                        </p>
                        <p className="text-sm mt-1">
                          <span className="text-slate-500">With:</span>{" "}
                          <span className="font-medium text-emerald-700">
                            "{suggestion.improved}"
                          </span>
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Sample Rewrites */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5 text-indigo-600" />
                Sample Sentences
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                <p className="text-xs font-medium text-slate-500 mb-1">
                  YOUR VERSION
                </p>
                <p className="text-sm text-slate-700">
                  Technology has made our lives easier.
                </p>
              </div>
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200">
                <p className="text-xs font-medium text-emerald-600 mb-1">
                  IMPROVED VERSION
                </p>
                <p className="text-sm text-emerald-700">
                  Technology has significantly enhanced our quality of life by
                  streamlining daily tasks and fostering global connectivity.
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => router.push("/writing")}
            >
              Try Again
            </Button>
            <Button className="flex-1" onClick={() => router.push("/writing")}>
              New Essay
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
