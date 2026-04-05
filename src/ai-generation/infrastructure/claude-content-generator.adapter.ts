import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

import type {
  AiContentGeneratorPort,
  CourseOutline,
  GeneratedQuiz,
} from '../domain/ports/ai-content-generator.port';

/**
 * Claude API adapter for AI content generation.
 * Uses fetch to call the Anthropic Messages API.
 */
@Injectable()
export class ClaudeContentGeneratorAdapter implements AiContentGeneratorPort {
  private readonly logger = new Logger(ClaudeContentGeneratorAdapter.name);
  private readonly apiKey: string;
  private readonly apiUrl = 'https://api.anthropic.com/v1/messages';

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('ANTHROPIC_API_KEY', '');
  }

  async generateCourseOutline(
    topic: string,
    notes?: string,
  ): Promise<CourseOutline> {
    this.logger.log(`Generating course outline via Claude API for topic: "${topic}"`);

    const systemPrompt = `You are a course designer for an internal corporate LMS (Learning Management System) at a credit union.
You create structured course outlines in Spanish.
You MUST respond with valid JSON only — no markdown, no code blocks, no explanation.
The JSON must match this schema exactly:
{
  "title": "string",
  "description": "string",
  "modules": [
    {
      "title": "string",
      "lessons": [
        { "title": "string", "type": "text" | "video" | "quiz" }
      ]
    }
  ]
}
Create 3-5 modules with 3-5 lessons each. Mix text, video, and quiz lesson types.
All content must be in Spanish.`;

    const userMessage = notes
      ? `Crea un outline de curso sobre: "${topic}"\n\nNotas adicionales del instructor:\n${notes}`
      : `Crea un outline de curso sobre: "${topic}"`;

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Claude API error: ${response.status} ${errorBody}`);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text?: string }>;
    };
    const textContent = data.content.find((c) => c.type === 'text');

    if (!textContent?.text) {
      throw new Error('No text content in Claude API response');
    }

    const outline = JSON.parse(textContent.text) as CourseOutline;

    this.logger.log(
      `Course outline generated: "${outline.title}" with ${outline.modules.length} modules`,
    );

    return outline;
  }

  async generateQuiz(
    lessonContent: string,
    questionCount: number,
  ): Promise<GeneratedQuiz> {
    this.logger.log(`Generating ${questionCount} quiz questions via Claude API`);

    const systemPrompt = `You are a quiz designer for an internal corporate LMS at a credit union.
You create quiz questions based on lesson content in Spanish.
You MUST respond with valid JSON only — no markdown, no code blocks, no explanation.
The JSON must be an array of question objects matching this schema exactly:
[
  {
    "type": "multiple_choice" | "multiple_select" | "true_false",
    "question": "string",
    "options": ["string"] (required for multiple_choice and multiple_select, omit for true_false),
    "correctAnswer": number (index for multiple_choice) | number[] (indexes for multiple_select) | boolean (for true_false),
    "explanation": "string (optional)"
  }
]
All content must be in Spanish. Generate varied question types.`;

    const userMessage = `Genera ${questionCount} preguntas de quiz basadas en este contenido de lección:\n\n${lessonContent}`;

    const response = await fetch(this.apiUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': this.apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 2048,
        system: systemPrompt,
        messages: [
          { role: 'user', content: userMessage },
        ],
      }),
    });

    if (!response.ok) {
      const errorBody = await response.text();
      this.logger.error(`Claude API error: ${response.status} ${errorBody}`);
      throw new Error(`Claude API error: ${response.status}`);
    }

    const data = (await response.json()) as {
      content: Array<{ type: string; text?: string }>;
    };
    const textContent = data.content.find((c) => c.type === 'text');

    if (!textContent?.text) {
      throw new Error('No text content in Claude API response');
    }

    const quiz = JSON.parse(textContent.text) as GeneratedQuiz;

    this.logger.log(`Generated ${quiz.length} quiz questions`);

    return quiz;
  }
}
