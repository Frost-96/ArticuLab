"use server";

import { getCurrentUser } from "@/lib/auth";
import { getFirstError } from "@/lib/error";
import {
    createConversationSchema,
    deleteConversationSchema,
    deleteMessageSchema,
    getConversationListSchema,
    getConversationMessagesSchema,
    getConversationSchema,
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
import type { ActionResult } from "@/schema/shared.schema";
import * as conversationService from "@/server/services/conversation.service";
import type {
    ConversationDetail,
    ConversationListResult,
    ConversationMessage,
} from "@/server/services/conversation.service";

async function requireCurrentUser() {
    const currentUser = await getCurrentUser();
    if (!currentUser) {
        return null;
    }

    return currentUser;
}

export async function getConversationListAction(
    input: GetConversationListInput,
): Promise<ActionResult<ConversationListResult>> {
    const currentUser = await requireCurrentUser();
    if (!currentUser) {
        return { success: false, error: "Unauthorized: Please login first" };
    }

    const parsed = getConversationListSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) };
    }

    try {
        const data = await conversationService.getConversationList(
            currentUser.userId,
            parsed.data,
        );
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to get conversations",
        };
    }
}

export async function getConversationAction(
    input: GetConversationInput,
): Promise<ActionResult<{ conversation: ConversationDetail }>> {
    const currentUser = await requireCurrentUser();
    if (!currentUser) {
        return { success: false, error: "Unauthorized: Please login first" };
    }

    const parsed = getConversationSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) };
    }

    try {
        const data = await conversationService.getConversation(
            currentUser.userId,
            parsed.data,
        );
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to get conversation",
        };
    }
}

export async function createConversationAction(
    input: CreateConversationInput,
): Promise<ActionResult<{ conversation: ConversationDetail }>> {
    const currentUser = await requireCurrentUser();
    if (!currentUser) {
        return { success: false, error: "Unauthorized: Please login first" };
    }

    const parsed = createConversationSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) };
    }

    try {
        const data = await conversationService.createConversation(
            currentUser.userId,
            parsed.data,
        );
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to create conversation",
        };
    }
}

export async function updateConversationTitleAction(
    input: UpdateConversationTitleInput,
): Promise<ActionResult<{ conversation: ConversationDetail }>> {
    const currentUser = await requireCurrentUser();
    if (!currentUser) {
        return { success: false, error: "Unauthorized: Please login first" };
    }

    const parsed = updateConversationTitleSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) };
    }

    try {
        const data = await conversationService.updateConversationTitle(
            currentUser.userId,
            parsed.data,
        );
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to update conversation",
        };
    }
}

export async function deleteConversationAction(
    input: DeleteConversationInput,
): Promise<ActionResult<{ id: string }>> {
    const currentUser = await requireCurrentUser();
    if (!currentUser) {
        return { success: false, error: "Unauthorized: Please login first" };
    }

    const parsed = deleteConversationSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) };
    }

    try {
        const data = await conversationService.deleteConversation(
            currentUser.userId,
            parsed.data,
        );
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to delete conversation",
        };
    }
}

export async function getConversationMessagesAction(
    input: GetConversationMessagesInput,
): Promise<ActionResult<{ messages: ConversationMessage[] }>> {
    const currentUser = await requireCurrentUser();
    if (!currentUser) {
        return { success: false, error: "Unauthorized: Please login first" };
    }

    const parsed = getConversationMessagesSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) };
    }

    try {
        const data = await conversationService.getConversationMessages(
            currentUser.userId,
            parsed.data,
        );
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error ? error.message : "Failed to get messages",
        };
    }
}

export async function saveMessageAction(
    input: SaveMessageInput,
): Promise<ActionResult<{ message: ConversationMessage }>> {
    const currentUser = await requireCurrentUser();
    if (!currentUser) {
        return { success: false, error: "Unauthorized: Please login first" };
    }

    const parsed = saveMessageSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) };
    }

    try {
        const data = await conversationService.saveMessage(
            currentUser.userId,
            parsed.data,
        );
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error ? error.message : "Failed to save message",
        };
    }
}

export async function updateMessageAction(
    input: UpdateMessageInput,
): Promise<ActionResult<{ message: ConversationMessage }>> {
    const currentUser = await requireCurrentUser();
    if (!currentUser) {
        return { success: false, error: "Unauthorized: Please login first" };
    }

    const parsed = updateMessageSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) };
    }

    try {
        const data = await conversationService.updateMessage(
            currentUser.userId,
            parsed.data,
        );
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to update message",
        };
    }
}

export async function deleteMessageAction(
    input: DeleteMessageInput,
): Promise<ActionResult<{ id: string; conversationId: string }>> {
    const currentUser = await requireCurrentUser();
    if (!currentUser) {
        return { success: false, error: "Unauthorized: Please login first" };
    }

    const parsed = deleteMessageSchema.safeParse(input);
    if (!parsed.success) {
        return { success: false, error: getFirstError(parsed.error) };
    }

    try {
        const data = await conversationService.deleteMessage(
            currentUser.userId,
            parsed.data,
        );
        return { success: true, data };
    } catch (error) {
        return {
            success: false,
            error:
                error instanceof Error
                    ? error.message
                    : "Failed to delete message",
        };
    }
}
