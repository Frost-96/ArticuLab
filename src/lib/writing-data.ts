import type { WritingScenarioType } from "@/schema";

// ─── Daily prompts ────────────────────────────────────────────────────────────

export const DAILY_PROMPTS: string[] = [
    "Describe a memorable journey you have taken. What made it special?",
    "Some people believe that social media has a negative impact on society. Do you agree or disagree?",
    "What are the advantages and disadvantages of working from home?",
    "Discuss the importance of learning foreign languages in today's world.",
];

// ─── Exam configurations ──────────────────────────────────────────────────────

export const EXAM_CONFIGS: Array<{
    id: WritingScenarioType;
    label: string;
    shortLabel: string;
    badgeColor: string;
    pillActive: string;
    wordTarget: number;
    wordRange: string;
    timeLimit: string;
    description: string;
    prompts: string[];
}> = [
    {
        id: "ielts_task2",
        label: "IELTS Task 2",
        shortLabel: "IELTS 2",
        badgeColor: "bg-amber-100 text-amber-700",
        pillActive: "bg-amber-500 text-white",
        wordTarget: 250,
        wordRange: "250+ words",
        timeLimit: "40 min",
        description:
            "Academic/General opinion, discussion or problem-solution essay",
        prompts: [
            "Some people believe that technology has made our lives more complex. To what extent do you agree or disagree?",
            "In many countries, the gap between the rich and the poor is increasing. What problems does this cause, and what solutions can you suggest?",
            "Some people think that universities should provide graduates with the knowledge and skills needed in the workplace. Others think that the true function of a university should be to give access to knowledge for its own sake. Discuss both views and give your opinion.",
        ],
    },
    {
        id: "ielts_task1",
        label: "IELTS Task 1",
        shortLabel: "IELTS 1",
        badgeColor: "bg-orange-100 text-orange-700",
        pillActive: "bg-orange-500 text-white",
        wordTarget: 150,
        wordRange: "150+ words",
        timeLimit: "20 min",
        description:
            "Describe and summarise visual information (graph, chart, diagram or map)",
        prompts: [
            "The bar chart below shows the percentage of households in owned and rented accommodation in England and Wales between 1918 and 2011. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
            "The diagram below shows the water cycle, which is the continuous movement of water on, above, and below the surface of the Earth. Summarise the information by selecting and reporting the main features.",
            "The table below gives information about the underground railway systems in six cities. Summarise the information by selecting and reporting the main features, and make comparisons where relevant.",
        ],
    },
    {
        id: "cet6",
        label: "英语六级",
        shortLabel: "CET-6",
        badgeColor: "bg-violet-100 text-violet-700",
        pillActive: "bg-violet-600 text-white",
        wordTarget: 180,
        wordRange: "180+ words",
        timeLimit: "30 min",
        description: "议论文或说明文，观点论证为主",
        prompts: [
            "Write an essay on the topic of The Impact of Artificial Intelligence on Employment. You are required to write at least 180 words.",
            "Write an essay on the following topic: Online Education — Advantages and Disadvantages. You should write at least 180 words.",
            "Write an essay: Is Social Media Bringing People Closer or Driving Them Apart? You should write at least 180 words.",
        ],
    },
    {
        id: "cet4",
        label: "英语四级",
        shortLabel: "CET-4",
        badgeColor: "bg-sky-100 text-sky-700",
        pillActive: "bg-sky-600 text-white",
        wordTarget: 120,
        wordRange: "120+ words",
        timeLimit: "30 min",
        description: "议论文或说明文，120~180词",
        prompts: [
            "Write an essay on the topic of The Importance of Physical Exercise. You are required to write at least 120 words.",
            "Write an essay on the following topic: My View on the Rise of Short Videos. You should write at least 120 words.",
            "Write an essay: Campus Volunteerism — Why Should College Students Participate? You should write at least 120 words.",
        ],
    },
];

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function getExamConfig(id: WritingScenarioType) {
    return EXAM_CONFIGS.find((e) => e.id === id);
}

export function pickRandom<T>(arr: T[]): T | undefined {
    return arr[Math.floor(Math.random() * arr.length)];
}
