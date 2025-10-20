import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { ActionTag, parseModelActions } from '../actionSchema';

const resetConsoleWarn = (spy: ReturnType<typeof vi.spyOn>) => {
    spy.mockRestore();
};

describe('parseModelActions', () => {
    let warnSpy: ReturnType<typeof vi.spyOn>;

    beforeEach(() => {
        warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    });

    afterEach(() => {
        resetConsoleWarn(warnSpy);
    });

    it('extracts conversational text and validates payloads with nested structures', () => {
        const raw = `Xin chào!\n[ACTION_INGEST_DOC]{\n  "docId": "doc-1",\n  "title": "Truyen",\n  "summary": "Tom tat",\n  "totalChapters": 12,\n  "writingStyle": "Nhanh",\n  "authorHabits": ["Mo dau bang cao trao"],\n  "lastAnalyzedChapter": 12,\n  "sections": [\n    {\n      "id": "sec-1",\n      "title": "Phan 1",\n      "summary": "Mo ta"\n    }\n  ]\n}\nHoan tat!`;

        const result = parseModelActions(raw);
        expect(result.userFacingText).toBe('Xin chào!\nHoan tat!');
        expect(result.actions).toHaveLength(1);
        const [action] = result.actions;
        expect(action.type).toBe(ActionTag.INGEST_DOC);
        expect(action.payload.sections?.[0]?.id).toBe('sec-1');
    });

    it('skips invalid payloads and warns without throwing', () => {
        const raw = `No content\n[ACTION_INGEST_DOC]{ "title": "Missing fields" }`;
        const result = parseModelActions(raw);
        expect(result.userFacingText).toBe('No content');
        expect(result.actions).toHaveLength(0);
        expect(warnSpy).toHaveBeenCalled();
    });

    it('ignores unknown actions but keeps text intact', () => {
        const raw = `Hi there\n[ACTION_UNKNOWN]{"test": true}`;
        const result = parseModelActions(raw);
        expect(result.userFacingText).toBe('Hi there');
        expect(result.actions).toHaveLength(0);
        expect(warnSpy).toHaveBeenCalledWith(expect.stringContaining('Unknown action tag received'));
    });
});