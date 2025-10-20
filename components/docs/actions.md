
# Action Tags & Schemas

The Couple AI frontend expects the language model to communicate side effects through *action tags*. Each action tag wraps a JSON payload that is validated on the client using [Zod](https://github.com/colinhacks/zod). This document describes the available tags, required fields, and how the UI reacts to them.

## Output format

Every action must follow the pattern:

```
[ACTION_NAME]{
  // valid JSON payload
}
```

Only one action block may be emitted in a single response. The conversational text should surround the action (usually before and after the block).

## ACTION_INGEST_DOC

Creates or refreshes a work profile after the model analyses a manuscript.

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `docId` | `string` | ✅ | Stable identifier for the manuscript. |
| `title` | `string` | ✅ | Human-friendly story title. |
| `summary` | `string` | ✅ | Concise synopsis that informs later critiques. |
| `totalChapters` | `number` | ✅ | Total number of chapters detected. Must be an integer ≥ 0. |
| `writingStyle` | `string` | ✅ | Description of the author's voice. |
| `authorHabits` | `string[]` | ✅ | At least one notable writing pattern. |
| `lastAnalyzedChapter` | `number` | ✅ | Highest chapter index that was processed. |
| `sections` | `{ id: string; title: string; summary?: string; }[]` | Optional | High-level arcs or sections identified during analysis. |
| `sourceUrl` | `string` (URL) | Optional | Public URL used to fetch the manuscript. |

**UI effect:**

* A new `WorkProfile` is created.
* Three default pages (Draft, Critique, Final) are spawned on the canvas and linked to the profile.
* The profile becomes the active selection.

## ACTION_CREATE_CRITIQUE_PAGE

Delivers editorial feedback as a markdown page.

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `page.title` | `string` | ✅ | Title of the generated canvas page. |
| `page.content` | `string` | ✅ | Markdown body containing critique content. |
| `profileId` | `string` | Optional | Target work profile. If omitted, the app falls back to the currently selected profile. |

**UI effect:**

* Generates a new canvas page with the supplied content.
* Links the page to the resolved work profile.
* Keeps positioning consistent using a 3-column grid.

## ACTION_PREPARE_PUBLICATION

Provides the data necessary to publish a chapter to an external platform.

| Field | Type | Required | Description |
| ----- | ---- | -------- | ----------- |
| `platform` | `string` | ✅ | Publishing destination (e.g., `RoyalRoad`). |
| `storyUrl` | `string` (URL) | ✅ | Landing page URL for the story. |
| `chapterTitle` | `string` | ✅ | Title of the chapter ready for release. |
| `contentSourcePageId` | `string` | ✅ | Canvas page containing the final manuscript. |
| `profileId` | `string` | Optional | Associated work profile, used for analytics or context. |

**UI effect:**

* Opens the publishing modal with the payload pre-filled.
* Keeps the UI responsive even if optional fields are missing by logging a warning instead of throwing an error.

## Validation & Fallbacks

* The `parseModelActions` helper (`services/actionSchema.ts`) extracts `[ACTION_*]` blocks and validates payloads against the schemas above.
* Invalid or unknown actions are skipped with a console warning. The natural language portion of the response is still rendered to the user.
* Downstream helpers in `services/actionEffects.ts` build deterministic UI changes (work profile creation, critique page placement, publication modal preparation). These helpers are covered by unit tests in `services/__tests__`.

Use this document as the source of truth when updating the system prompt or introducing new actions.