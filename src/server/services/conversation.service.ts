import { getFirstError } from "@/lib/error";
import {
    createConversationSchema,
    deleteConversationSchema,
    deleteMessageSchema,
    getConversationListSchema,
    getConversationMessagesSchema,
    getConversationSchema,
    idSchema,
    saveMessageSchema,
    updateConversationTitleSchema,
    updateMessageSchema,
    type CreateConversationInput,
    type DeleteConversationInput,
    type DeleteMessageInput,
    type GetConversationInput,
    type GetConversationListInput,
    type GetConversationMessagesInput,
    type SaveMessageInput,
    type UpdateConversationTitleInput,
    type UpdateMessageInput,
} from "@/schema";
import * as conversationRepo from "@/server/repositories/conversation.repository";
import * as scenarioRepo from "@/server/repositories/scenario.repository";

type ConversationRecord = NonNullable<
    Awaited<ReturnType<typeof conversationRepo.findConversationById>>
>;
type ConversationSummaryRecord = Awaited<
    ReturnType<typeof conversationRepo.findConversations>
>["rows"][number];
type MessageRecord = Awaited<
    ReturnType<typeof conversationRepo.findMessages>
>[number];

export type ConversationMessage = {
    id: string;
    conversationId: string;
    role: "user" | "assistant";
    content: string;
    audioUrl: string | null;
    createdAt: string;
    updatedAt: string;
};

export type ConversationSummary = {
    id: string;
    userId: string;
    type: "coach" | "writing" | "speaking";
    title: string | null;
    scenarioId: string | null;
    messageCount: number;
    createdAt: string;
    updatedAt: string;
};

export type ConversationDetail = ConversationSummary & {
    scenario: {
        title: string;
        type: string;
        category: string;
    } | null;
    messages: ConversationMessage[];
};

export type ConversationListResult = {
    conversations: ConversationSummary[];
    pagination: {
        page: number;
        limit: number;
        total: number;
        totalPages: number;
    };
};

function normalizeUserId(userId: string) {
    const parsedId = idSchema.safeParse(userId);
    if (!parsedId.success) {
        throw new Error(getFirstError(parsedId.error));
    }

    return parsedId.data;
}

function mapMessage(record: MessageRecord): ConversationMessage {
    return {
        id: record.id,
        conversationId: record.conversationId,
        role: record.role as "user" | "assistant",
        content: record.content,
        audioUrl: record.audioUrl,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
    };
}

function mapConversationSummary(
    record: ConversationSummaryRecord,
): ConversationSummary {
    return {
        id: record.id,
        userId: record.userId,
        type: record.type as "coach" | "writing" | "speaking",
        title: record.title,
        scenarioId: record.scenarioId,
        messageCount: record._count.messages,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
    };
}

function mapConversationDetail(record: ConversationRecord): ConversationDetail {
    return {
        id: record.id,
        userId: record.userId,
        type: record.type as "coach" | "writing" | "speaking",
        title: record.title,
        scenarioId: record.scenarioId,
        messageCount: record.messages.length,
        createdAt: record.createdAt.toISOString(),
        updatedAt: record.updatedAt.toISOString(),
        scenario: record.scenario
            ? {
                  title: record.scenario.title,
                  type: record.scenario.type,
                  category: record.scenario.category,
              }
            : null,
        messages: record.messages.map(mapMessage),
    };
}

export async function getConversationList(
    userId: string,
    input: GetConversationListInput,
): Promise<ConversationListResult> {
    const parsedUserId = normalizeUserId(userId);
    const parsedInput = getConversationListSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const { page, pageSize, type } = parsedInput.data;
    const skip = (page - 1) * pageSize;
    const { rows, total } = await conversationRepo.findConversations({
        userId: parsedUserId,
        type,
        skip,
        take: pageSize,
    });

    return {
        conversations: rows.map(mapConversationSummary),
        pagination: {
            page,
            limit: pageSize,
            total,
            totalPages: Math.max(1, Math.ceil(total / pageSize)),
        },
    };
}

export async function getConversation(
    userId: string,
    input: GetConversationInput,
): Promise<{ conversation: ConversationDetail }> {
    const parsedUserId = normalizeUserId(userId);
    const parsedInput = getConversationSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const conversation = await conversationRepo.findConversationById(
        parsedInput.data.id,
        parsedUserId,
    );
    if (!conversation) {
        throw new Error("Conversation not found");
    }

    return { conversation: mapConversationDetail(conversation) };
}

export async function createConversation(
    userId: string,
    input: CreateConversationInput,
): Promise<{ conversation: ConversationDetail }> {
    const parsedUserId = normalizeUserId(userId);
    const parsedInput = createConversationSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const { scenarioId, type } = parsedInput.data;
    if (scenarioId) {
        const scenario = await scenarioRepo.findScenarioById(scenarioId);
        if (!scenario) {
            throw new Error("Scenario not found");
        }
        if (scenario.type !== type) {
            throw new Error("Scenario type does not match conversation type");
        }
    }

    const conversation = await conversationRepo.createConversation({
        userId: parsedUserId,
        type,
        title: parsedInput.data.title,
        scenarioId: scenarioId ?? null,
    });

    return { conversation: mapConversationDetail(conversation) };
}

export async function updateConversationTitle(
    userId: string,
    input: UpdateConversationTitleInput,
): Promise<{ conversation: ConversationDetail }> {
    const parsedUserId = normalizeUserId(userId);
    const parsedInput = updateConversationTitleSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const existing = await conversationRepo.findConversationById(
        parsedInput.data.id,
        parsedUserId,
    );
    if (!existing) {
        throw new Error("Conversation not found");
    }

    const conversation = await conversationRepo.updateConversationTitle(
        existing.id,
        parsedInput.data.title,
    );

    return { conversation: mapConversationDetail(conversation) };
}

export async function deleteConversation(
    userId: string,
    input: DeleteConversationInput,
): Promise<{ id: string }> {
    const parsedUserId = normalizeUserId(userId);
    const parsedInput = deleteConversationSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const existing = await conversationRepo.findConversationById(
        parsedInput.data.id,
        parsedUserId,
    );
    if (!existing) {
        throw new Error("Conversation not found");
    }

    return conversationRepo.deleteConversation(existing.id);
}

export async function getConversationMessages(
    userId: string,
    input: GetConversationMessagesInput,
): Promise<{ messages: ConversationMessage[] }> {
    const parsedUserId = normalizeUserId(userId);
    const parsedInput = getConversationMessagesSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const existing = await conversationRepo.findConversationById(
        parsedInput.data.conversationId,
        parsedUserId,
    );
    if (!existing) {
        throw new Error("Conversation not found");
    }

    const messages = await conversationRepo.findMessages({
        userId: parsedUserId,
        conversationId: parsedInput.data.conversationId,
        cursor: parsedInput.data.cursor,
        take: parsedInput.data.limit,
    });

    return { messages: messages.map(mapMessage) };
}

export async function saveMessage(
    userId: string,
    input: SaveMessageInput,
): Promise<{ message: ConversationMessage }> {
    const parsedUserId = normalizeUserId(userId);
    const parsedInput = saveMessageSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const existing = await conversationRepo.findConversationById(
        parsedInput.data.conversationId,
        parsedUserId,
    );
    if (!existing) {
        throw new Error("Conversation not found");
    }

    const message = await conversationRepo.createMessage(parsedInput.data);
    return { message: mapMessage(message) };
}

export async function updateMessage(
    userId: string,
    input: UpdateMessageInput,
): Promise<{ message: ConversationMessage }> {
    const parsedUserId = normalizeUserId(userId);
    const parsedInput = updateMessageSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const existing = await conversationRepo.findMessageByIdForUser(
        parsedInput.data.id,
        parsedUserId,
    );
    if (!existing) {
        throw new Error("Message not found");
    }

    const message = await conversationRepo.updateMessage(existing.id, {
        content: parsedInput.data.content,
        audioUrl: parsedInput.data.audioUrl,
    });

    return { message: mapMessage(message) };
}

export async function deleteMessage(
    userId: string,
    input: DeleteMessageInput,
): Promise<{ id: string; conversationId: string }> {
    const parsedUserId = normalizeUserId(userId);
    const parsedInput = deleteMessageSchema.safeParse(input);
    if (!parsedInput.success) {
        throw new Error(getFirstError(parsedInput.error));
    }

    const existing = await conversationRepo.findMessageByIdForUser(
        parsedInput.data.id,
        parsedUserId,
    );
    if (!existing) {
        throw new Error("Message not found");
    }

    return conversationRepo.deleteMessage(existing.id);
}
