# Couple AI - Your Professional Writing & Publishing Studio

## 🚀 Introduction

Couple AI is an intelligent studio designed to be a professional partner for literary authors. It transforms the solitary process of writing into an interactive, AI-assisted journey, from initial analysis and drafting to critique and automated publishing.

The core concept is to provide authors with a powerful, integrated environment that understands their work deeply. By analyzing a story via a Google Doc link, Couple AI creates a "Work Profile"—a condensed summary of the plot, writing style, and author's habits. This profile allows the AI to provide highly relevant, contextual feedback within a flexible canvas workspace, streamlining the entire creative lifecycle.

## ✨ Core Features

*   **✍️ Professional Editorial Assistant:** Engage with an AI trained to act as a professional editor, providing insightful feedback on drafts.
*   **🔗 Google Doc Integration:** Simply provide a Google Doc link to your manuscript. The AI performs a deep analysis to understand your story's essence.
*   **📖 Automated Work Profile:** The AI generates a persistent "Work Profile" for each story, summarizing the plot, style, chapter count, and even your unique writing habits. This profile ensures the AI's advice is always relevant.
*   **⚡️ Efficient Updates:** The AI is smart. After the initial analysis, it will only scan for new chapters in your Google Doc, making updates fast and efficient.
*   **🎨 Dynamic Workspace Canvas:** The familiar infinite canvas is optimized for a writer's workflow, providing dedicated, linked pages for your Drafts, AI Critiques, and Final Chapters for each project.
*   **📝 Google Docs-like Interaction:** Pages on the canvas behave like documents. Their height is automatic, and you can adjust their width, allowing content to reflow naturally.
*   **🤖 Automated Publishing:** A "killer feature" that automates the final step. Instruct the AI to publish your finalized chapter, and it will prepare the data to be sent to platforms like Royal Road (simulation-ready).
*   **💾 Persistent State:** Your entire studio—messages, work profiles, and all pages—is automatically saved to your browser's `localStorage`.

## 🛠️ How It Works

Couple AI leverages a powerful, custom-engineered System Prompt for the Google Gemini API to function as a specialized application.

1.  **System Prompt Engineering:** A sophisticated system prompt defines the AI's persona as an "Editorial & Publishing Assistant" and outlines a set of structured "ACTION TAGS" it must use to communicate with the React frontend.
2.  **Structured AI Responses:** When you provide a Google Doc URL, the AI responds with natural language followed by an `[ACTION_INGEST_DOC]{...}` block containing validated metadata about the manuscript.
3.  **Frontend Parsing & State Management:** The React application uses a Zod-backed parser to validate action payloads before mutating UI state, ensuring malformed data never crashes the experience.
4.  **Dynamic UI & Workflow:**
    *   `[ACTION_INGEST_DOC]` creates a `WorkProfile` and automatically sets up a 3-page workspace (Draft, Critique, Final) on the canvas for that story.
    *   `[ACTION_CREATE_CRITIQUE_PAGE]` drops a new critique page with the supplied Markdown content.
    *   `[ACTION_PREPARE_PUBLICATION]` opens a confirmation modal prefilled with publishing parameters.
## 💻 Tech Stack

*   **Frontend:** React 19, TypeScript
*   **Styling:** Tailwind CSS
*   **AI Model:** Google Gemini API (`@google/genai`)
*   **Markdown Rendering:** `react-markdown`
*   **Canvas Interaction:** Custom implementation for pan, zoom, and contextual resizing/panning.

## 🚀 Getting Started

1.  **Clone the repository.**
2.  **Install dependencies** (`npm install`).
3.  **Set up your Google Gemini API Key** as an environment variable (`process.env.API_KEY`).
4.  **Start the development server** (`npm start`).
5.  **Interact:** Paste a public Google Doc link into the chat to begin.

## 📁 Project Structure

```
.
├── src/
│   ├── components/
│   │   ├── ChatWidget.tsx
│   │   ├── DocumentCanvas.tsx
│   │   └── icons.tsx
│   ├── services/
│   │   └── geminiService.ts    # Contains the core System Prompt for the AI
│   ├── App.tsx                 # Main application component, manages state
│   ├── index.tsx
│   └── types.ts                # Defines crucial types like WorkProfile
└── ...
```