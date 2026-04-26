import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";
import { hashPassword } from "../src/lib/bcrypt";

const DEMO_EMAIL = "demo@articulab.local";
const DEMO_PASSWORD = "Demo123456!";

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    throw new Error("DATABASE_URL is required to run the demo seed.");
}

const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString }),
});

type SeedDb = Omit<
    typeof prisma,
    "$connect" | "$disconnect" | "$on" | "$transaction" | "$extends"
>;

type ScenarioSeed = {
    key: string;
    type: "writing" | "speaking";
    category: string;
    title: string;
    description: string;
    prompt: string;
    aiRole?: string;
    difficulty: "easy" | "medium" | "hard";
};

type WritingExerciseSeed = {
    scenarioKey: string;
    scenarioType: "ielts_task2" | "daily";
    prompt: string;
    content: string;
    wordCount: number;
    status: "draft" | "reviewed";
    overallScore: number | null;
    grammarScore: number | null;
    vocabularyScore: number | null;
    coherenceScore: number | null;
    taskScore: number | null;
    feedback: object | null;
    createdAt: Date;
    updatedAt: Date;
};

type SpeakingExerciseSeed = {
    scenarioKey: string;
    scenarioType: "interview" | "travel";
    scenarioRole: string;
    conversationTitle: string;
    status: "completed" | "reviewed";
    totalTurns: number;
    durationSeconds: number;
    fluencyScore: number | null;
    accuracyScore: number | null;
    feedback: object | null;
    createdAt: Date;
    updatedAt: Date;
    messages: Array<{
        role: "user" | "assistant";
        content: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
};

type CoachConversationSeed = {
    title: string;
    createdAt: Date;
    updatedAt: Date;
    messages: Array<{
        role: "user" | "assistant";
        content: string;
        createdAt: Date;
        updatedAt: Date;
    }>;
};

function daysAgo(days: number, hour: number, minute = 0): Date {
    const value = new Date();
    value.setHours(hour, minute, 0, 0);
    value.setDate(value.getDate() - days);
    return value;
}

function shiftMinutes(date: Date, minutes: number): Date {
    return new Date(date.getTime() + minutes * 60 * 1000);
}

const scenarios: ScenarioSeed[] = [
    {
        key: "writing-ielts-task2",
        type: "writing",
        category: "ielts_task2",
        title: "IELTS Task 2: Remote Work Policy",
        description:
            "Discuss whether companies should let employees work remotely most of the week.",
        prompt: "Some people believe remote work improves productivity, while others think it harms teamwork. Discuss both views and give your opinion.",
        difficulty: "medium",
    },
    {
        key: "writing-daily",
        type: "writing",
        category: "daily",
        title: "Daily Writing: Feedback to a Manager",
        description:
            "Write a thoughtful message to your manager after finishing a collaborative project.",
        prompt: "Write a short reflection email to your manager about what you learned from your latest team project and what support would help you improve further.",
        difficulty: "easy",
    },
    {
        key: "speaking-interview",
        type: "speaking",
        category: "interview",
        title: "Speaking Scenario: Product Designer Interview",
        description:
            "Practice introducing your experience, project impact, and collaboration style in an interview.",
        prompt: "Act as a hiring manager interviewing a candidate for a product designer role. Ask focused follow-up questions and encourage specific examples.",
        aiRole: "Hiring Manager",
        difficulty: "medium",
    },
    {
        key: "speaking-travel",
        type: "speaking",
        category: "travel",
        title: "Speaking Scenario: Hotel Check-in Problem",
        description:
            "Handle a real-world travel issue politely and clearly while asking for help.",
        prompt: "Act as a hotel front desk agent helping a traveler whose room booking has a mistake. Keep the conversation practical and natural.",
        aiRole: "Hotel Front Desk Agent",
        difficulty: "easy",
    },
];

function buildWritingFeedback(input: {
    overallScore: number;
    grammarScore: number;
    vocabularyScore: number;
    coherenceScore: number;
    taskScore: number;
    overallComment: string;
    sentenceFeedback: Array<{
        original: string;
        corrected?: string;
        severity: "error" | "warning" | "suggestion";
        category: string;
        explanation: string;
        alternatives?: string[];
    }>;
    strengths: string[];
    improvements: string[];
    sampleExpressions?: Array<{
        original: string;
        improved: string;
        explanation: string;
    }>;
}) {
    return input;
}

function buildSpeakingFeedback(input: {
    fluencyScore: number;
    accuracyScore: number;
    overallComment: string;
    grammarErrors: Array<{
        original: string;
        corrected: string;
        explanation: string;
    }>;
    vocabularyAnalysis: {
        totalUniqueWords: number;
        advancedWordsUsed: string[];
        suggestedVocabulary: Array<{
            word: string;
            definition: string;
            exampleSentence: string;
        }>;
    };
    expressionSuggestions: Array<{
        original: string;
        improved: string;
        explanation: string;
    }>;
    strengths: string[];
    improvements: string[];
}) {
    return input;
}

const writingExercises: WritingExerciseSeed[] = [
    {
        scenarioKey: "writing-ielts-task2",
        scenarioType: "ielts_task2",
        prompt: "Some people believe remote work improves productivity, while others think it harms teamwork. Discuss both views and give your opinion.",
        content:
            "Remote work has become common in many companies, and opinions about it are divided. Some employees say it helps them focus and organize their schedules better, while others argue that it weakens communication and team spirit. In my view, remote work can improve productivity when organizations build strong routines for collaboration.\n\nOn the one hand, working from home can reduce commuting time and allow employees to plan their day more effectively. Many people complete deep work faster in a quiet home environment because they face fewer interruptions. As a result, they may produce better reports, designs, or code in less time.\n\nOn the other hand, teamwork may suffer if remote communication is poorly managed. Informal conversations often help colleagues solve small problems quickly, and these moments are harder to recreate online. New employees may also feel isolated when they do not have enough direct support.\n\nOverall, I believe remote work is beneficial, but only when managers set clear expectations, schedule regular check-ins, and protect time for collaboration. Without these systems, flexibility can easily turn into confusion.",
        wordCount: 172,
        status: "reviewed",
        overallScore: 6.5,
        grammarScore: 6.0,
        vocabularyScore: 6.5,
        coherenceScore: 6.5,
        taskScore: 7.0,
        feedback: buildWritingFeedback({
            overallScore: 6.5,
            grammarScore: 6.0,
            vocabularyScore: 6.5,
            coherenceScore: 6.5,
            taskScore: 7.0,
            overallComment:
                "The essay addresses both views clearly and reaches a balanced conclusion, but several grammar choices reduce precision.",
            sentenceFeedback: [
                {
                    original:
                        "Many people complete deep work faster in a quiet home environment because they face fewer interruptions.",
                    corrected:
                        "Many people complete focused work faster in a quiet home environment because they face fewer interruptions.",
                    severity: "suggestion",
                    category: "vocabulary",
                    explanation:
                        "Focused work sounds more natural here than deep work in a general IELTS essay.",
                    alternatives: ["focused work", "concentrated tasks"],
                },
                {
                    original:
                        "Without these systems, flexibility can easily turn into confusion.",
                    severity: "warning",
                    category: "coherence",
                    explanation:
                        "A stronger reference to the collaboration systems would make the final sentence connect more directly to the previous point.",
                    alternatives: [
                        "Without these collaboration systems, flexibility can easily turn into confusion.",
                    ],
                },
                {
                    original:
                        "Some employees say it helps them focus and organize their schedules better, while others argue that it weakens communication and team spirit.",
                    corrected:
                        "Some employees say it helps them focus and organize their schedules more effectively, while others argue that it weakens communication and team spirit.",
                    severity: "error",
                    category: "grammar",
                    explanation:
                        "More effectively fits the comparative structure more naturally than better in this sentence.",
                    alternatives: ["more effectively"],
                },
            ],
            strengths: [
                "The response discusses both views before giving a clear opinion.",
                "Paragraphing is logical and easy to follow.",
            ],
            improvements: [
                "Use more precise academic vocabulary in key arguments.",
                "Tighten sentence control so comparisons sound more natural.",
            ],
            sampleExpressions: [
                {
                    original: "helps them focus",
                    improved: "allows them to maintain stronger concentration",
                    explanation:
                        "This phrasing sounds more formal and suits an IELTS discussion essay.",
                },
            ],
        }),
        createdAt: daysAgo(49, 9, 15),
        updatedAt: daysAgo(49, 10, 5),
    },
    {
        scenarioKey: "writing-daily",
        scenarioType: "daily",
        prompt: "Write a short reflection email to your manager about what you learned from your latest team project and what support would help you improve further.",
        content:
            "Hi Sarah,\n\nI wanted to share a few thoughts after we finished the website refresh project. I learned that clear planning at the beginning saves a lot of time later, especially when several teammates depend on the same deadlines. I also became more confident in presenting design decisions during our review meetings.\n\nOne area I still want to improve is explaining technical limits in a simple way for non-design teammates. Sometimes I know the issue, but I need more time to describe it clearly. If possible, I would appreciate more chances to lead short check-ins or present progress updates so I can practice this skill.\n\nThank you for your support throughout the project.\n\nBest,\nDemo",
        wordCount: 123,
        status: "reviewed",
        overallScore: 7.3,
        grammarScore: 7.0,
        vocabularyScore: 7.5,
        coherenceScore: 7.5,
        taskScore: 7.0,
        feedback: buildWritingFeedback({
            overallScore: 7.3,
            grammarScore: 7.0,
            vocabularyScore: 7.5,
            coherenceScore: 7.5,
            taskScore: 7.0,
            overallComment:
                "This email is professional and easy to follow, with a clear reflection and a realistic request for support.",
            sentenceFeedback: [
                {
                    original:
                        "Sometimes I know the issue, but I need more time to describe it clearly.",
                    corrected:
                        "Sometimes I understand the issue, but I need more time to explain it clearly.",
                    severity: "suggestion",
                    category: "vocabulary",
                    explanation:
                        "Understand and explain are slightly more precise verb choices in a professional email.",
                    alternatives: [
                        "I understand the issue",
                        "I need more time to explain it clearly",
                    ],
                },
                {
                    original:
                        "I learned that clear planning at the beginning saves a lot of time later, especially when several teammates depend on the same deadlines.",
                    severity: "warning",
                    category: "task",
                    explanation:
                        "This sentence is strong, but adding one concrete example would make the reflection feel more specific.",
                },
            ],
            strengths: [
                "Tone is warm and professional.",
                "The improvement request is practical and easy for a manager to act on.",
            ],
            improvements: [
                "Add one concrete example to strengthen the reflection.",
                "Continue refining precise workplace vocabulary.",
            ],
        }),
        createdAt: daysAgo(21, 14, 0),
        updatedAt: daysAgo(21, 14, 18),
    },
    {
        scenarioKey: "writing-ielts-task2",
        scenarioType: "ielts_task2",
        prompt: "Some people believe remote work improves productivity, while others think it harms teamwork. Discuss both views and give your opinion.",
        content:
            "It is often argued that remote work allows staff to be more productive, but other people think it creates weaker cooperation. I partly agree with the first view because employees can save time and manage their tasks more independently. However, I also believe companies must actively protect communication.\n\nEmployees who work from home usually avoid long journeys and can use that energy for real tasks. They may also feel more comfortable in their own environment, which can improve concentration. For example, a designer might finish a detailed layout faster at home than in a noisy office.\n\nNevertheless, remote work can create communication problems. Online messages are useful, but they do not always replace quick face-to-face discussion. Team members may misunderstand priorities, and junior workers may hesitate to ask for help.\n\nIn conclusion, remote work is effective when businesses provide clear goals, regular meetings, and a culture of support. Without these habits, the quality of teamwork may decline even if individual output rises.",
        wordCount: 163,
        status: "reviewed",
        overallScore: 6.9,
        grammarScore: 6.2,
        vocabularyScore: 6.8,
        coherenceScore: 7.2,
        taskScore: 7.0,
        feedback: buildWritingFeedback({
            overallScore: 6.9,
            grammarScore: 6.2,
            vocabularyScore: 6.8,
            coherenceScore: 7.2,
            taskScore: 7.0,
            overallComment:
                "The structure is clear and the conclusion is balanced, but grammar accuracy still limits the overall band.",
            sentenceFeedback: [
                {
                    original:
                        "They may also feel more comfortable in their own environment, which can improve concentration.",
                    severity: "warning",
                    category: "coherence",
                    explanation:
                        "The point is relevant, but connecting it more directly to productivity would make the argument stronger.",
                    alternatives: [
                        "They may also feel more comfortable in their own environment, which can improve concentration and therefore productivity.",
                    ],
                },
                {
                    original:
                        "Online messages are useful, but they do not always replace quick face-to-face discussion.",
                    corrected:
                        "Online messages are useful, but they do not always replace quick face-to-face discussions.",
                    severity: "error",
                    category: "grammar",
                    explanation:
                        "The plural noun fits better because the sentence refers to discussions in general.",
                    alternatives: ["quick face-to-face discussions"],
                },
            ],
            strengths: [
                "The response stays focused on the question throughout.",
                "The conclusion clearly summarizes the writer's position.",
            ],
            improvements: [
                "Watch plural noun usage in general statements.",
                "Link supporting examples more explicitly to the main claim.",
            ],
        }),
        createdAt: daysAgo(6, 19, 45),
        updatedAt: daysAgo(6, 20, 5),
    },
    {
        scenarioKey: "writing-daily",
        scenarioType: "daily",
        prompt: "Write a short reflection email to your manager about what you learned from your latest team project and what support would help you improve further.",
        content:
            "Hi Sarah,\n\nThe project taught me a lot about working across teams. I became more aware of how small delays can affect everyone else, so I tried to share updates earlier than before. I also noticed that I write clearer design notes when I prepare examples before a meeting.\n\nI still want to improve how I speak during fast discussions because I sometimes lose my main point. I think leading more short project summaries would help me practice being concise.\n\nThanks,\nDemo",
        wordCount: 88,
        status: "reviewed",
        overallScore: 7.8,
        grammarScore: 7.6,
        vocabularyScore: 7.7,
        coherenceScore: 7.9,
        taskScore: 8.0,
        feedback: buildWritingFeedback({
            overallScore: 7.8,
            grammarScore: 7.6,
            vocabularyScore: 7.7,
            coherenceScore: 7.9,
            taskScore: 8.0,
            overallComment:
                "The response is concise but complete, with a strong sense of audience and purpose.",
            sentenceFeedback: [
                {
                    original:
                        "I still want to improve how I speak during fast discussions because I sometimes lose my main point.",
                    corrected:
                        "I still want to improve how I speak during fast discussions because I sometimes lose track of my main point.",
                    severity: "suggestion",
                    category: "vocabulary",
                    explanation:
                        "Lose track of my main point is a more natural expression.",
                    alternatives: ["lose track of my main point"],
                },
            ],
            strengths: [
                "The email sounds natural and appropriately professional.",
                "The learning reflection and support request are both specific.",
            ],
            improvements: [
                "Keep building a wider range of workplace expressions.",
            ],
        }),
        createdAt: daysAgo(1, 11, 10),
        updatedAt: daysAgo(1, 11, 20),
    },
    {
        scenarioKey: "writing-daily",
        scenarioType: "daily",
        prompt: "Write a short reflection email to your manager about what you learned from your latest team project and what support would help you improve further.",
        content:
            "Hi Sarah, I am drafting a quick note about what I learned from the launch project. I want to mention better planning and clearer communication, but I still need to organize the final message before I send it.",
        wordCount: 38,
        status: "draft",
        overallScore: null,
        grammarScore: null,
        vocabularyScore: null,
        coherenceScore: null,
        taskScore: null,
        feedback: null,
        createdAt: daysAgo(0, 8, 20),
        updatedAt: daysAgo(0, 8, 20),
    },
];

const speakingExercises: SpeakingExerciseSeed[] = [
    {
        scenarioKey: "speaking-interview",
        scenarioType: "interview",
        scenarioRole: "Hiring Manager",
        conversationTitle: "Product Designer Interview Practice",
        status: "reviewed",
        totalTurns: 8,
        durationSeconds: 760,
        fluencyScore: 6.8,
        accuracyScore: 6.5,
        feedback: buildSpeakingFeedback({
            fluencyScore: 6.8,
            accuracyScore: 6.5,
            overallComment:
                "You answered with relevant ideas and good energy, but a few grammar slips and vague expressions reduced impact.",
            grammarErrors: [
                {
                    original: "I have lead two product launches last year.",
                    corrected: "I led two product launches last year.",
                    explanation:
                        "Use the simple past form led with a finished time expression like last year.",
                },
            ],
            vocabularyAnalysis: {
                totalUniqueWords: 124,
                advancedWordsUsed: ["trade-off", "facilitate", "iteration"],
                suggestedVocabulary: [
                    {
                        word: "cross-functional",
                        definition:
                            "involving several different teams or departments",
                        exampleSentence:
                            "I enjoy leading cross-functional projects with engineering and marketing partners.",
                    },
                ],
            },
            expressionSuggestions: [
                {
                    original: "I worked with many people",
                    improved:
                        "I collaborated closely with cross-functional stakeholders",
                    explanation:
                        "This sounds more professional and specific in an interview.",
                },
            ],
            strengths: [
                "You stayed calm and answered every question directly.",
                "Your examples showed real project ownership.",
            ],
            improvements: [
                "Use more precise interview vocabulary for collaboration.",
                "Check verb tense when describing finished experience.",
            ],
        }),
        createdAt: daysAgo(42, 18, 0),
        updatedAt: daysAgo(42, 18, 20),
        messages: [
            {
                role: "assistant",
                content:
                    "Welcome back. Let's practice a product designer interview. Can you briefly introduce yourself?",
                createdAt: daysAgo(42, 18, 0),
                updatedAt: daysAgo(42, 18, 0),
            },
            {
                role: "user",
                content:
                    "Sure. I'm a product designer with three years of experience focusing on mobile and web interfaces.",
                createdAt: shiftMinutes(daysAgo(42, 18, 0), 1),
                updatedAt: shiftMinutes(daysAgo(42, 18, 0), 1),
            },
            {
                role: "assistant",
                content:
                    "Tell me about a project where you balanced user needs with business goals.",
                createdAt: shiftMinutes(daysAgo(42, 18, 0), 2),
                updatedAt: shiftMinutes(daysAgo(42, 18, 0), 2),
            },
            {
                role: "user",
                content:
                    "In our onboarding redesign, I simplified the first-time flow while keeping the signup conversion target.",
                createdAt: shiftMinutes(daysAgo(42, 18, 0), 3),
                updatedAt: shiftMinutes(daysAgo(42, 18, 0), 3),
            },
        ],
    },
    {
        scenarioKey: "speaking-travel",
        scenarioType: "travel",
        scenarioRole: "Hotel Front Desk Agent",
        conversationTitle: "Hotel Check-in Issue",
        status: "reviewed",
        totalTurns: 6,
        durationSeconds: 520,
        fluencyScore: 7.4,
        accuracyScore: 7.1,
        feedback: buildSpeakingFeedback({
            fluencyScore: 7.4,
            accuracyScore: 7.1,
            overallComment:
                "You communicated politely and clearly, and your requests were easy to follow.",
            grammarErrors: [
                {
                    original: "My booking say a double room.",
                    corrected: "My booking says a double room.",
                    explanation:
                        "The singular subject booking needs the verb says.",
                },
            ],
            vocabularyAnalysis: {
                totalUniqueWords: 101,
                advancedWordsUsed: ["reservation", "confirm", "arrangement"],
                suggestedVocabulary: [
                    {
                        word: "availability",
                        definition: "the state of being free to use",
                        exampleSentence:
                            "Could you check availability for a quieter room?",
                    },
                ],
            },
            expressionSuggestions: [
                {
                    original: "Can you change it?",
                    improved:
                        "Could you check whether there is any availability to change it?",
                    explanation:
                        "This sounds more polite and more natural in a travel service conversation.",
                },
            ],
            strengths: [
                "Your tone was consistently polite.",
                "You asked for clarification when needed.",
            ],
            improvements: [
                "Keep practicing subject-verb agreement in short requests.",
            ],
        }),
        createdAt: daysAgo(13, 16, 30),
        updatedAt: daysAgo(13, 16, 42),
        messages: [
            {
                role: "assistant",
                content:
                    "Good evening. Welcome to the hotel. How may I help you?",
                createdAt: daysAgo(13, 16, 30),
                updatedAt: daysAgo(13, 16, 30),
            },
            {
                role: "user",
                content:
                    "Hi, I think there is a mistake in my reservation because I booked a double room.",
                createdAt: shiftMinutes(daysAgo(13, 16, 30), 1),
                updatedAt: shiftMinutes(daysAgo(13, 16, 30), 1),
            },
            {
                role: "assistant",
                content:
                    "I see. Let me check the booking details. Would you prefer one bed or two beds tonight?",
                createdAt: shiftMinutes(daysAgo(13, 16, 30), 2),
                updatedAt: shiftMinutes(daysAgo(13, 16, 30), 2),
            },
            {
                role: "user",
                content:
                    "One large bed is fine. I just want the room type to match the reservation.",
                createdAt: shiftMinutes(daysAgo(13, 16, 30), 3),
                updatedAt: shiftMinutes(daysAgo(13, 16, 30), 3),
            },
        ],
    },
    {
        scenarioKey: "speaking-interview",
        scenarioType: "interview",
        scenarioRole: "Hiring Manager",
        conversationTitle: "Behavioral Interview Follow-up",
        status: "reviewed",
        totalTurns: 10,
        durationSeconds: 910,
        fluencyScore: 7.9,
        accuracyScore: 7.3,
        feedback: buildSpeakingFeedback({
            fluencyScore: 7.9,
            accuracyScore: 7.3,
            overallComment:
                "You spoke with better pacing and stronger examples than before, and your structure was clearer.",
            grammarErrors: [
                {
                    original:
                        "That project help me understand stakeholder needs faster.",
                    corrected:
                        "That project helped me understand stakeholder needs faster.",
                    explanation:
                        "Use the past tense helped because the project happened in the past.",
                },
            ],
            vocabularyAnalysis: {
                totalUniqueWords: 138,
                advancedWordsUsed: ["prioritize", "stakeholder", "alignment"],
                suggestedVocabulary: [
                    {
                        word: "trade-off",
                        definition:
                            "a balance between two competing priorities",
                        exampleSentence:
                            "I explained the trade-off between speed and research depth.",
                    },
                    {
                        word: "alignment",
                        definition: "shared agreement between people or teams",
                        exampleSentence:
                            "Weekly reviews helped us maintain alignment across the team.",
                    },
                ],
            },
            expressionSuggestions: [
                {
                    original: "we agreed in the end",
                    improved:
                        "we reached alignment after reviewing the trade-offs",
                    explanation:
                        "This sounds more polished and interview-ready.",
                },
            ],
            strengths: [
                "Your answers used a clear challenge-action-result structure.",
                "You handled follow-up questions with confidence.",
            ],
            improvements: [
                "Keep sharpening verb tense accuracy.",
                "Use more advanced linking phrases between ideas.",
            ],
        }),
        createdAt: daysAgo(0, 13, 10),
        updatedAt: daysAgo(0, 13, 28),
        messages: [
            {
                role: "assistant",
                content:
                    "Let's continue with a behavioral question. Tell me about a time you had to influence a difficult stakeholder.",
                createdAt: daysAgo(0, 13, 10),
                updatedAt: daysAgo(0, 13, 10),
            },
            {
                role: "user",
                content:
                    "In a dashboard redesign, one stakeholder wanted too many metrics on the first screen, so I proposed a simpler hierarchy and showed prototype feedback.",
                createdAt: shiftMinutes(daysAgo(0, 13, 10), 1),
                updatedAt: shiftMinutes(daysAgo(0, 13, 10), 1),
            },
            {
                role: "assistant",
                content:
                    "How did you persuade them to accept the simpler version?",
                createdAt: shiftMinutes(daysAgo(0, 13, 10), 2),
                updatedAt: shiftMinutes(daysAgo(0, 13, 10), 2),
            },
            {
                role: "user",
                content:
                    "I compared the cluttered layout with a focused alternative and explained the trade-off between visibility and comprehension.",
                createdAt: shiftMinutes(daysAgo(0, 13, 10), 3),
                updatedAt: shiftMinutes(daysAgo(0, 13, 10), 3),
            },
        ],
    },
    {
        scenarioKey: "speaking-travel",
        scenarioType: "travel",
        scenarioRole: "Hotel Front Desk Agent",
        conversationTitle: "Late Check-in Practice",
        status: "completed",
        totalTurns: 5,
        durationSeconds: 305,
        fluencyScore: null,
        accuracyScore: null,
        feedback: null,
        createdAt: daysAgo(2, 20, 40),
        updatedAt: daysAgo(2, 20, 50),
        messages: [
            {
                role: "assistant",
                content: "Hello, welcome. Are you checking in now?",
                createdAt: daysAgo(2, 20, 40),
                updatedAt: daysAgo(2, 20, 40),
            },
            {
                role: "user",
                content:
                    "Yes, sorry I'm late. My train was delayed and I want to confirm my room is still available.",
                createdAt: shiftMinutes(daysAgo(2, 20, 40), 1),
                updatedAt: shiftMinutes(daysAgo(2, 20, 40), 1),
            },
            {
                role: "assistant",
                content:
                    "No problem. May I see your passport and booking number?",
                createdAt: shiftMinutes(daysAgo(2, 20, 40), 2),
                updatedAt: shiftMinutes(daysAgo(2, 20, 40), 2),
            },
        ],
    },
];

const coachConversations: CoachConversationSeed[] = [
    {
        title: "Grammar and tone check for a follow-up email",
        createdAt: daysAgo(7, 10, 0),
        updatedAt: daysAgo(7, 10, 12),
        messages: [
            {
                role: "user",
                content:
                    "Can you help me make my follow-up email sound more confident but still polite?",
                createdAt: daysAgo(7, 10, 0),
                updatedAt: daysAgo(7, 10, 0),
            },
            {
                role: "assistant",
                content:
                    "Absolutely. Share the draft and I will improve the tone while keeping it professional.",
                createdAt: shiftMinutes(daysAgo(7, 10, 0), 1),
                updatedAt: shiftMinutes(daysAgo(7, 10, 0), 1),
            },
            {
                role: "user",
                content:
                    "I wrote: I just want to know if you already saw my portfolio.",
                createdAt: shiftMinutes(daysAgo(7, 10, 0), 2),
                updatedAt: shiftMinutes(daysAgo(7, 10, 0), 2),
            },
            {
                role: "assistant",
                content:
                    "A stronger version would be: I wanted to follow up and see whether you had a chance to review my portfolio.",
                createdAt: shiftMinutes(daysAgo(7, 10, 0), 3),
                updatedAt: shiftMinutes(daysAgo(7, 10, 0), 3),
            },
            {
                role: "user",
                content: "That sounds much better. Why is it more natural?",
                createdAt: shiftMinutes(daysAgo(7, 10, 0), 4),
                updatedAt: shiftMinutes(daysAgo(7, 10, 0), 4),
            },
            {
                role: "assistant",
                content:
                    "It is softer and more professional because it avoids sounding abrupt while still making the purpose clear.",
                createdAt: shiftMinutes(daysAgo(7, 10, 0), 5),
                updatedAt: shiftMinutes(daysAgo(7, 10, 0), 5),
            },
        ],
    },
    {
        title: "Vocabulary upgrade for project presentation",
        createdAt: daysAgo(0, 9, 30),
        updatedAt: daysAgo(0, 9, 46),
        messages: [
            {
                role: "user",
                content:
                    "I keep repeating good and useful in my presentation. Can you give me better words?",
                createdAt: daysAgo(0, 9, 30),
                updatedAt: daysAgo(0, 9, 30),
            },
            {
                role: "assistant",
                content:
                    "Sure. Depending on the context, you could use effective, valuable, practical, beneficial, or impactful.",
                createdAt: shiftMinutes(daysAgo(0, 9, 30), 1),
                updatedAt: shiftMinutes(daysAgo(0, 9, 30), 1),
            },
            {
                role: "user",
                content: "How can I say the workshop was good for the team?",
                createdAt: shiftMinutes(daysAgo(0, 9, 30), 2),
                updatedAt: shiftMinutes(daysAgo(0, 9, 30), 2),
            },
            {
                role: "assistant",
                content:
                    "You could say the workshop was valuable for the team or that it had a positive impact on team alignment.",
                createdAt: shiftMinutes(daysAgo(0, 9, 30), 3),
                updatedAt: shiftMinutes(daysAgo(0, 9, 30), 3),
            },
            {
                role: "user",
                content: "Can you give me one full sentence I can use?",
                createdAt: shiftMinutes(daysAgo(0, 9, 30), 4),
                updatedAt: shiftMinutes(daysAgo(0, 9, 30), 4),
            },
            {
                role: "assistant",
                content:
                    "The workshop was especially valuable because it helped the team reach alignment on priorities much faster.",
                createdAt: shiftMinutes(daysAgo(0, 9, 30), 5),
                updatedAt: shiftMinutes(daysAgo(0, 9, 30), 5),
            },
        ],
    },
];

async function ensureScenarioMap(db: SeedDb) {
    const entries = await Promise.all(
        scenarios.map(async (scenario) => {
            const record = await db.scenario.upsert({
                where: {
                    id: `seed-${scenario.key}`,
                },
                update: {
                    type: scenario.type,
                    category: scenario.category,
                    title: scenario.title,
                    description: scenario.description,
                    prompt: scenario.prompt,
                    aiRole: scenario.aiRole ?? null,
                    difficulty: scenario.difficulty,
                    isGenerated: false,
                    isDeleted: false,
                },
                create: {
                    id: `seed-${scenario.key}`,
                    type: scenario.type,
                    category: scenario.category,
                    title: scenario.title,
                    description: scenario.description,
                    prompt: scenario.prompt,
                    aiRole: scenario.aiRole ?? null,
                    difficulty: scenario.difficulty,
                    isGenerated: false,
                    isDeleted: false,
                },
            });

            return [scenario.key, record.id] as const;
        }),
    );

    return new Map(entries);
}

async function clearExistingDemoData(db: SeedDb, userId: string) {
    await db.message.deleteMany({
        where: {
            conversation: {
                userId,
            },
        },
    });

    await db.speakingExercise.deleteMany({
        where: { userId },
    });

    await db.conversation.deleteMany({
        where: { userId },
    });

    await db.writingExercise.deleteMany({
        where: { userId },
    });

    await db.subscription.deleteMany({
        where: { userId },
    });

    await db.emailVerification.deleteMany({
        where: { userId },
    });
}

async function seedWritingExercises(
    db: SeedDb,
    userId: string,
    scenarioIds: Map<string, string>,
) {
    for (const [index, item] of writingExercises.entries()) {
        const scenarioId = scenarioIds.get(item.scenarioKey);

        if (!scenarioId) {
            throw new Error(`Missing scenario for key ${item.scenarioKey}`);
        }

        await db.writingExercise.create({
            data: {
                id: `seed-writing-${index + 1}`,
                userId,
                scenarioId,
                scenarioType: item.scenarioType,
                prompt: item.prompt,
                isCustomPrompt: item.scenarioType !== "daily",
                content: item.content,
                wordCount: item.wordCount,
                status: item.status,
                overallScore: item.overallScore,
                grammarScore: item.grammarScore,
                vocabularyScore: item.vocabularyScore,
                coherenceScore: item.coherenceScore,
                taskScore: item.taskScore,
                feedback: item.feedback ?? undefined,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            },
        });
    }
}

async function seedSpeakingExercises(
    db: SeedDb,
    userId: string,
    scenarioIds: Map<string, string>,
) {
    for (const [index, item] of speakingExercises.entries()) {
        const scenarioId = scenarioIds.get(item.scenarioKey);

        if (!scenarioId) {
            throw new Error(`Missing scenario for key ${item.scenarioKey}`);
        }

        const conversationId = `seed-speaking-conversation-${index + 1}`;

        await db.conversation.create({
            data: {
                id: conversationId,
                userId,
                type: "speaking",
                title: item.conversationTitle,
                scenarioId,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
                messages: {
                    create: item.messages.map((message, messageIndex) => ({
                        id: `seed-speaking-message-${index + 1}-${messageIndex + 1}`,
                        role: message.role,
                        content: message.content,
                        createdAt: message.createdAt,
                        updatedAt: message.updatedAt,
                    })),
                },
            },
        });

        await db.speakingExercise.create({
            data: {
                id: `seed-speaking-${index + 1}`,
                userId,
                scenarioId,
                scenarioType: item.scenarioType,
                scenarioRole: item.scenarioRole,
                conversationId,
                status: item.status,
                totalTurns: item.totalTurns,
                durationSeconds: item.durationSeconds,
                fluencyScore: item.fluencyScore,
                accuracyScore: item.accuracyScore,
                feedback: item.feedback ?? undefined,
                createdAt: item.createdAt,
                updatedAt: item.updatedAt,
            },
        });
    }
}

async function seedCoachConversations(db: SeedDb, userId: string) {
    for (const [index, conversation] of coachConversations.entries()) {
        await db.conversation.create({
            data: {
                id: `seed-coach-conversation-${index + 1}`,
                userId,
                type: "coach",
                title: conversation.title,
                createdAt: conversation.createdAt,
                updatedAt: conversation.updatedAt,
                messages: {
                    create: conversation.messages.map(
                        (message, messageIndex) => ({
                            id: `seed-coach-message-${index + 1}-${messageIndex + 1}`,
                            role: message.role,
                            content: message.content,
                            createdAt: message.createdAt,
                            updatedAt: message.updatedAt,
                        }),
                    ),
                },
            },
        });
    }
}

async function main() {
    const hashedPassword = await hashPassword(DEMO_PASSWORD);
    const result = await prisma.$transaction(async (tx) => {
        const scenarioIds = await ensureScenarioMap(tx);
        const user = await tx.user.upsert({
            where: { email: DEMO_EMAIL },
            update: {
                name: "Demo Learner",
                password: hashedPassword,
                englishLevel: "intermediate",
                learningGoal: "career",
                membershipTier: "pro",
                membershipExpiry: daysAgo(-30, 23, 59),
                isDeleted: false,
            },
            create: {
                id: "seed-demo-user",
                email: DEMO_EMAIL,
                name: "Demo Learner",
                password: hashedPassword,
                englishLevel: "intermediate",
                learningGoal: "career",
                membershipTier: "pro",
                membershipExpiry: daysAgo(-30, 23, 59),
                isDeleted: false,
            },
            select: {
                id: true,
                email: true,
            },
        });

        await clearExistingDemoData(tx, user.id);
        await seedWritingExercises(tx, user.id, scenarioIds);
        await seedSpeakingExercises(tx, user.id, scenarioIds);
        await seedCoachConversations(tx, user.id);

        await tx.subscription.create({
            data: {
                id: "seed-demo-subscription",
                userId: user.id,
                plan: "monthly",
                status: "active",
                startDate: daysAgo(15, 0, 0),
                endDate: daysAgo(-15, 23, 59),
                paymentProvider: "demo",
                externalId: "demo-subscription-monthly",
                createdAt: daysAgo(15, 0, 0),
                updatedAt: daysAgo(0, 9, 50),
            },
        });

        const [writingCount, speakingCount, coachCount] = await Promise.all([
            tx.writingExercise.count({ where: { userId: user.id } }),
            tx.speakingExercise.count({ where: { userId: user.id } }),
            tx.conversation.count({
                where: { userId: user.id, type: "coach" },
            }),
        ]);

        return {
            email: user.email,
            writingCount,
            speakingCount,
            coachCount,
        };
    });

    console.log("Demo seed completed.");
    console.log(`User: ${result.email}`);
    console.log(`Writing exercises: ${result.writingCount}`);
    console.log(`Speaking exercises: ${result.speakingCount}`);
    console.log(`Coach conversations: ${result.coachCount}`);
}

try {
    await main();
} finally {
    await prisma.$disconnect();
}
