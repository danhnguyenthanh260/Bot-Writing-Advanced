import { AgentContext } from './contextRetrievalService';

export interface PromptOptions {
  maxContextLength?: number;
  includeFullContent?: boolean;
  prioritizeRecent?: boolean;
}

/**
 * Construct prompt for agent
 */
export function constructAgentPrompt(
  userQuery: string,
  context: AgentContext,
  options: PromptOptions = {}
): string {
  const {
    maxContextLength = 8000,
    includeFullContent = false,
    prioritizeRecent = true,
  } = options;
  
  let prompt = `You are a writing assistant helping the author.\n\n`;
  let currentLength = prompt.length;
  
  // 1. Book-level context (background)
  if (context.book_context) {
    prompt += `## Book Context:\n`;
    prompt += `Summary: ${context.book_context.summary}\n`;
    
    if (context.book_context.characters && context.book_context.characters.length > 0) {
      prompt += `Characters: ${JSON.stringify(context.book_context.characters.slice(0, 10))}\n`;
    }
    
    if (context.book_context.writing_style) {
      prompt += `Writing Style: ${JSON.stringify(context.book_context.writing_style)}\n`;
    }
    
    if (context.book_context.story_arc) {
      prompt += `Story Arc: ${JSON.stringify(context.book_context.story_arc)}\n`;
    }
    
    prompt += `\n`;
    currentLength = prompt.length;
  }
  
  // 2. Recent chapters (immediate context)
  if (context.recent_chapters && context.recent_chapters.length > 0) {
    prompt += `## Recent Chapters (Most Relevant Context):\n`;
    
    // Prioritize most recent first
    const chapters = prioritizeRecent 
      ? [...context.recent_chapters].sort((a, b) => 
          new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime()
        )
      : context.recent_chapters;
    
    chapters.forEach((chapter, index) => {
      if (currentLength > maxContextLength) return; // Stop if too long
      
      prompt += `\n### Chapter ${chapter.chapter_number}: ${chapter.title || 'Untitled'}\n`;
      prompt += `Summary: ${chapter.summary}\n`;
      
      if (chapter.key_scenes && chapter.key_scenes.length > 0) {
        prompt += `Key Scenes: ${JSON.stringify(chapter.key_scenes.slice(0, 3))}\n`;
      }
      
      // Include full content for most recent chapter
      if (index === 0 && includeFullContent && chapter.content) {
        const contentPreview = chapter.content.substring(0, 2000);
        prompt += `Full Content: ${contentPreview}${chapter.content.length > 2000 ? '...' : ''}\n`;
      }
      
      currentLength = prompt.length;
    });
    
    prompt += `\n`;
  }
  
  // 3. Semantic search results (specific matches)
  if (context.semantic_results && context.semantic_results.length > 0) {
    prompt += `## Relevant Passages (from semantic search):\n`;
    
    context.semantic_results.slice(0, 5).forEach(result => {
      if (currentLength > maxContextLength) return;
      
      prompt += `\n### ${result.title || `Chapter ${result.chapter_number}`}\n`;
      prompt += `${result.summary}\n`;
      
      if (result.matched_chunks && result.matched_chunks.length > 0) {
        prompt += `Relevant Excerpts:\n`;
        result.matched_chunks.slice(0, 3).forEach(chunk => {
          if (currentLength > maxContextLength) return;
          prompt += `- ${chunk.chunk_text.substring(0, 200)}${chunk.chunk_text.length > 200 ? '...' : ''}\n`;
          currentLength = prompt.length;
        });
      }
      
      prompt += `\n`;
      currentLength = prompt.length;
    });
  }
  
  // 4. User query
  prompt += `## User Query:\n${userQuery}\n\n`;
  prompt += `Please provide helpful writing assistance based on the context above.`;
  
  return prompt;
}











