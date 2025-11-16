export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
  missingFields: string[];
  invalidFields: string[];
}

/**
 * Validate book context schema
 */
export function validateBookContextSchema(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields: string[] = [];
  const invalidFields: string[] = [];
  
  // Required fields
  const requiredFields = ['summary', 'characters', 'writing_style', 'story_arc'];
  requiredFields.forEach(field => {
    if (!data[field]) {
      missingFields.push(field);
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  // Validate summary
  if (data.summary) {
    if (typeof data.summary !== 'string') {
      invalidFields.push('summary');
      errors.push('Summary must be a string');
    } else {
      const wordCount = data.summary.split(/\s+/).length;
      if (wordCount < 500) {
        warnings.push('Summary is shorter than recommended (500 words)');
      }
      if (wordCount > 1000) {
        warnings.push('Summary is longer than recommended (1000 words)');
      }
    }
  }
  
  // Validate characters
  if (data.characters) {
    if (!Array.isArray(data.characters)) {
      invalidFields.push('characters');
      errors.push('Characters must be an array');
    } else {
      if (data.characters.length === 0) {
        warnings.push('No characters found in book');
      }
      
      // Validate each character
      data.characters.forEach((char: any, index: number) => {
        if (!char.name) {
          errors.push(`Character ${index}: missing name`);
        }
        if (char.role && !['main', 'supporting', 'minor'].includes(char.role)) {
          warnings.push(`Character ${index}: invalid role "${char.role}"`);
        }
      });
    }
  }
  
  // Validate writing style
  if (data.writing_style) {
    if (typeof data.writing_style !== 'object') {
      invalidFields.push('writing_style');
      errors.push('Writing style must be an object');
    } else {
      if (data.writing_style.pov && !['first', 'second', 'third'].includes(data.writing_style.pov)) {
        warnings.push(`Invalid POV in writing style: ${data.writing_style.pov}`);
      }
    }
  }
  
  // Validate story arc
  if (data.story_arc) {
    if (typeof data.story_arc !== 'object') {
      invalidFields.push('story_arc');
      errors.push('Story arc must be an object');
    } else {
      const requiredActs = ['act1', 'act2', 'act3'];
      requiredActs.forEach(act => {
        if (!data.story_arc[act]) {
          missingFields.push(`story_arc.${act}`);
          warnings.push(`Missing story arc: ${act}`);
        }
      });
    }
  }
  
  // Validate world_setting (optional but should be object if present)
  if (data.world_setting && typeof data.world_setting !== 'object') {
    invalidFields.push('world_setting');
    warnings.push('World setting should be an object');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missingFields,
    invalidFields,
  };
}

/**
 * Validate chapter metadata schema
 */
export function validateChapterMetadataSchema(data: any): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];
  const missingFields: string[] = [];
  const invalidFields: string[] = [];
  
  // Required fields
  const requiredFields = ['summary', 'plot_points'];
  requiredFields.forEach(field => {
    if (!data[field]) {
      missingFields.push(field);
      errors.push(`Missing required field: ${field}`);
    }
  });
  
  // Validate summary
  if (data.summary) {
    if (typeof data.summary !== 'string') {
      invalidFields.push('summary');
      errors.push('Summary must be a string');
    } else {
      const wordCount = data.summary.split(/\s+/).length;
      if (wordCount < 100) {
        warnings.push('Chapter summary is shorter than recommended (100 words)');
      }
      if (wordCount > 300) {
        warnings.push('Chapter summary is longer than recommended (300 words)');
      }
    }
  }
  
  // Validate key scenes
  if (data.key_scenes !== undefined) {
    if (!Array.isArray(data.key_scenes)) {
      invalidFields.push('key_scenes');
      errors.push('Key scenes must be an array');
    }
  }
  
  // Validate character appearances
  if (data.character_appearances !== undefined) {
    if (!Array.isArray(data.character_appearances)) {
      invalidFields.push('character_appearances');
      errors.push('Character appearances must be an array');
    }
  }
  
  // Validate plot points
  if (data.plot_points) {
    if (typeof data.plot_points !== 'object') {
      invalidFields.push('plot_points');
      errors.push('Plot points must be an object');
    } else {
      if (data.plot_points.events !== undefined && !Array.isArray(data.plot_points.events)) {
        errors.push('Plot points.events must be an array');
      }
      if (data.plot_points.conflicts !== undefined && !Array.isArray(data.plot_points.conflicts)) {
        errors.push('Plot points.conflicts must be an array');
      }
      if (data.plot_points.resolutions !== undefined && !Array.isArray(data.plot_points.resolutions)) {
        errors.push('Plot points.resolutions must be an array');
      }
    }
  }
  
  // Validate writing notes
  if (data.writing_notes !== undefined && !Array.isArray(data.writing_notes)) {
    invalidFields.push('writing_notes');
    warnings.push('Writing notes should be an array');
  }
  
  return {
    valid: errors.length === 0,
    errors,
    warnings,
    missingFields,
    invalidFields,
  };
}

/**
 * Calculate confidence score (0-1)
 */
export function calculateConfidence(validation: ValidationResult): number {
  let score = 1.0;
  
  // Deduct for errors (more severe)
  score -= validation.errors.length * 0.2;
  
  // Deduct for warnings (less severe)
  score -= validation.warnings.length * 0.05;
  
  // Deduct for missing fields
  score -= validation.missingFields.length * 0.1;
  
  // Deduct for invalid fields
  score -= validation.invalidFields.length * 0.15;
  
  // Ensure score is between 0 and 1
  return Math.max(0, Math.min(1, score));
}











