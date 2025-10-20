
import { z } from 'zod';

export enum ActionTag {
    INGEST_DOC = 'ACTION_INGEST_DOC',
    CREATE_CRITIQUE_PAGE = 'ACTION_CREATE_CRITIQUE_PAGE',
    PREPARE_PUBLICATION = 'ACTION_PREPARE_PUBLICATION',
}

const sectionSchema = z.object({
    id: z.string().min(1, 'Section id is required.'),
    title: z.string().min(1, 'Section title is required.'),
    summary: z.string().optional(),
});

const ingestDocSchema = z.object({
    docId: z.string().min(1, 'docId is required.'),
    title: z.string().min(1, 'title is required.'),
    summary: z.string().min(1, 'summary is required.'),
    totalChapters: z.number().int().nonnegative(),
    writingStyle: z.string().min(1, 'writingStyle is required.'),
    authorHabits: z.array(z.string().min(1)).min(1, 'authorHabits requires at least one entry.'),
    lastAnalyzedChapter: z.number().int().nonnegative(),
    sections: z.array(sectionSchema).optional(),
    sourceUrl: z.string().url().optional(),
});

const critiquePageSchema = z.object({
    profileId: z.string().optional(),
    page: z.object({
        title: z.string().min(1, 'page.title is required.'),
        content: z.string().min(1, 'page.content is required.'),
    }),
});

const preparePublicationSchema = z.object({
    platform: z.string().min(1, 'platform is required.'),
    storyUrl: z.string().url('storyUrl must be a valid URL.'),
    chapterTitle: z.string().min(1, 'chapterTitle is required.'),
    contentSourcePageId: z.string().min(1, 'contentSourcePageId is required.'),
    profileId: z.string().optional(),
});

export const actionSchemas = {
    [ActionTag.INGEST_DOC]: ingestDocSchema,
    [ActionTag.CREATE_CRITIQUE_PAGE]: critiquePageSchema,
    [ActionTag.PREPARE_PUBLICATION]: preparePublicationSchema,
} as const;

type ActionSchemaMap = typeof actionSchemas;

export type ActionPayloads = {
    [K in keyof ActionSchemaMap]: z.infer<ActionSchemaMap[K]>;
};

export interface ParsedAction<T extends ActionTag = ActionTag> {
    type: T;
    payload: ActionPayloads[T];
}

export interface ParsedModelActions {
    userFacingText: string;
    actions: ParsedAction[];
}

const tagRegex = /\[(ACTION_[A-Z0-9_]+)\]/g;

const sanitizeJson = (input: string) => {
    try {
        return JSON.parse(input);
    } catch (error) {
        console.warn('Failed to parse action payload as JSON.', error, input);
        return null;
    }
};

interface JsonBlock {
    start: number;
    end: number;
    block: string;
}

const extractJsonBlock = (text: string, fromIndex: number): JsonBlock | null => {
    let start = -1;
    let depth = 0;
    let inString = false;
    let escape = false;

    for (let i = fromIndex; i < text.length; i++) {
        const char = text[i];

        if (start === -1) {
            if (/\s/.test(char)) {
                continue;
            }
            if (char === '{') {
                start = i;
                depth = 1;
                continue;
            }
            console.warn('Action tag is missing a JSON payload.');
            return null;
        }

        if (inString) {
            if (escape) {
                escape = false;
            } else if (char === '\\') {
                escape = true;
            } else if (char === '"') {
                inString = false;
            }
            continue;
        }

        if (char === '"') {
            inString = true;
            continue;
        }

        if (char === '{') {
            depth += 1;
        } else if (char === '}') {
            depth -= 1;
            if (depth === 0 && start !== -1) {
                return { start, end: i, block: text.slice(start, i + 1) };
            }
        }
    }

    console.warn('Action payload appears to be incomplete JSON.');
    return null;
};

export const parseModelActions = (rawResponse: string): ParsedModelActions => {
    if (!rawResponse) {
        return { userFacingText: '', actions: [] };
    }

    const actions: ParsedAction[] = [];
    const textSegments: string[] = [];
    let cursor = 0;

    let match: RegExpExecArray | null;
    tagRegex.lastIndex = 0;

    while ((match = tagRegex.exec(rawResponse)) !== null) {
        const tag = match[1];
        const tagStart = match.index;

        if (cursor < tagStart) {
            textSegments.push(rawResponse.slice(cursor, tagStart));
        }

        const jsonBlock = extractJsonBlock(rawResponse, tagRegex.lastIndex);
        if (!jsonBlock) {
            cursor = tagRegex.lastIndex;
            continue;
        }

        const payloadText = jsonBlock.block;

        if (!(tag in actionSchemas)) {
            console.warn(`Unknown action tag received: ${tag}. Payload skipped.`);
        } else {
            const parsedJson = sanitizeJson(payloadText);
            if (parsedJson) {
                const schema = actionSchemas[tag as ActionTag];
                const parsedResult = schema.safeParse(parsedJson);
                if (parsedResult.success) {
                    actions.push({
                        type: tag as ActionTag,
                        payload: parsedResult.data as ActionPayloads[ActionTag],
                    });
                } else {
                    console.warn(`Payload validation failed for ${tag}:`, parsedResult.error.flatten());
                }
            }
        }

        cursor = jsonBlock.end + 1;
        tagRegex.lastIndex = cursor;
    }

    if (cursor < rawResponse.length) {
        textSegments.push(rawResponse.slice(cursor));
    }

    return {
        userFacingText: textSegments.join('').trim(),
        actions,
    };
};