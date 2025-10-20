
import { describe, expect, it, vi } from 'vitest';
import { createCritiquePageFromAction, createWorkProfileFromIngestAction, ensureProfileAssociation } from '../actionEffects';

describe('action effects helpers', () => {
    it('creates work profile and default pages with deterministic ids', () => {
        const idFactory = vi.fn()
            .mockReturnValueOnce('profile-1')
            .mockReturnValueOnce('page-1')
            .mockReturnValueOnce('page-2')
            .mockReturnValueOnce('page-3');

        const payload = {
            docId: 'doc-123',
            title: 'Sample Story',
            summary: 'A quick synopsis',
            totalChapters: 5,
            writingStyle: 'Light-hearted',
            authorHabits: ['Opens with dialogue'],
            lastAnalyzedChapter: 5,
            sections: [{ id: 'arc-1', title: 'Act I' }],
        } as const;

        const { profile, pages } = createWorkProfileFromIngestAction(payload, 'https://docs.example.com/abc', idFactory);

        expect(profile.id).toBe('profile-1');
        expect(profile.pageIds).toEqual(['page-1', 'page-2', 'page-3']);
        expect(profile.docId).toBe('doc-123');
        expect(pages).toHaveLength(3);
        expect(pages[0].id).toBe('page-1');
        expect(pages[0].title).toContain('Sample Story');
    });

    it('creates critique page with grid positioning', () => {
        const payload = {
            profileId: 'profile-1',
            page: {
                title: 'Critique - Chapter 1',
                content: '## Feedback',
            },
        };
        const idFactory = vi.fn().mockReturnValue('critique-1');
        const page = createCritiquePageFromAction(payload, 4, idFactory);
        expect(page.id).toBe('critique-1');
        expect(page.position).toEqual({ x: 150 + (4 % 3) * 450, y: 150 + Math.floor(4 / 3) * 450 });
    });

    it('ensures profile association with fallbacks', () => {
        const profileIds = ['a', 'b'];
        expect(ensureProfileAssociation(profileIds, 'a', 'b')).toBe('b');
        expect(ensureProfileAssociation(profileIds, 'a')).toBe('a');
        expect(ensureProfileAssociation(profileIds, null)).toBe('a');
        expect(ensureProfileAssociation([], null)).toBeNull();
    });
});