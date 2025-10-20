import type { CanvasPage, WorkProfile } from '../types';
import { ActionTag, type ActionPayloads } from './actionSchema';

export type IdFactory = () => string;

export const defaultIdFactory: IdFactory = () => {
    if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
        return crypto.randomUUID();
    }
    return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

export interface IngestDocEffect {
    profile: WorkProfile;
    pages: CanvasPage[];
}

const defaultPageTemplates = [
    {
        title: 'Bản Nháp',
        content: '# Bắt đầu viết bản nháp của bạn ở đây...',
        position: { x: 100, y: 100 },
    },
    {
        title: 'Đánh giá',
        content: '# Nơi nhận các phân tích và góp ý từ AI.',
        position: { x: 550, y: 100 },
    },
    {
        title: 'Hoàn chỉnh',
        content: '# Nơi chứa chương truyện đã được chau chuốt.',
        position: { x: 1000, y: 100 },
    },
];

export const createWorkProfileFromIngestAction = (
    payload: ActionPayloads[ActionTag.INGEST_DOC],
    fallbackUrl: string,
    idFactory: IdFactory = defaultIdFactory,
): IngestDocEffect => {
    const profileId = idFactory();
    const pageIds: string[] = [];

    const pages = defaultPageTemplates.map((template) => {
        const pageId = idFactory();
        pageIds.push(pageId);
        return {
            id: pageId,
            title: `${template.title} - ${payload.title}`,
            content: template.content,
            position: template.position,
            size: { width: 400, height: 300 },
        } satisfies CanvasPage;
    });

    const googleDocUrl = payload.sourceUrl || fallbackUrl || `doc:${payload.docId}`;

    const profile: WorkProfile = {
        id: profileId,
        googleDocUrl,
        title: payload.title,
        summary: payload.summary,
        totalChapters: payload.totalChapters,
        writingStyle: payload.writingStyle,
        authorHabits: payload.authorHabits,
        lastAnalyzedChapter: payload.lastAnalyzedChapter,
        pageIds,
        docId: payload.docId,
    };

    return { profile, pages };
};

export const createCritiquePageFromAction = (
    payload: ActionPayloads[ActionTag.CREATE_CRITIQUE_PAGE],
    existingCount: number,
    idFactory: IdFactory = defaultIdFactory,
): CanvasPage => {
    const id = idFactory();
    return {
        id,
        title: payload.page.title,
        content: payload.page.content,
        position: {
            x: 150 + (existingCount % 3) * 450,
            y: 150 + Math.floor(existingCount / 3) * 450,
        },
        size: { width: 400, height: 300 },
    };
};

export const ensureProfileAssociation = (
    profileIds: string[],
    fallbackId: string | null,
    requestedId?: string,
): string | null => {
    if (requestedId && profileIds.includes(requestedId)) {
        return requestedId;
    }
    if (fallbackId && profileIds.includes(fallbackId)) {
        return fallbackId;
    }
    return profileIds[0] ?? null;
};
