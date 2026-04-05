import { Injectable, Logger } from '@nestjs/common';

import type {
  AiContentGeneratorPort,
  CourseOutline,
  GeneratedQuiz,
} from '../domain/ports/ai-content-generator.port';

/**
 * Mock adapter for AI content generation.
 * Returns a hardcoded outline for development/testing.
 */
@Injectable()
export class MockContentGeneratorAdapter implements AiContentGeneratorPort {
  private readonly logger = new Logger(MockContentGeneratorAdapter.name);

  async generateCourseOutline(
    topic: string,
    notes?: string,
  ): Promise<CourseOutline> {
    this.logger.warn(
      `Using MOCK AI adapter for topic: "${topic}"${notes ? ' (with notes)' : ''}`,
    );

    return {
      title: `Curso: ${topic}`,
      description: `Curso generado automáticamente sobre ${topic}. Este es un outline de ejemplo generado por el adaptador mock.`,
      modules: [
        {
          title: `Módulo 1: Introducción a ${topic}`,
          lessons: [
            { title: `¿Qué es ${topic}?`, type: 'text' },
            { title: 'Conceptos fundamentales', type: 'text' },
            { title: 'Video introductorio', type: 'video' },
            { title: 'Quiz de conceptos básicos', type: 'quiz' },
          ],
        },
        {
          title: `Módulo 2: ${topic} en la práctica`,
          lessons: [
            { title: 'Casos de uso comunes', type: 'text' },
            { title: 'Demostración práctica', type: 'video' },
            { title: 'Ejercicio práctico', type: 'text' },
          ],
        },
        {
          title: `Módulo 3: ${topic} avanzado`,
          lessons: [
            { title: 'Técnicas avanzadas', type: 'text' },
            { title: 'Mejores prácticas', type: 'text' },
            { title: 'Evaluación final', type: 'quiz' },
          ],
        },
      ],
    };
  }

  async generateQuiz(
    _lessonContent: string,
    _questionCount: number,
  ): Promise<GeneratedQuiz> {
    this.logger.warn('Using MOCK AI adapter for quiz generation');

    return [
      {
        type: 'multiple_choice',
        question: '¿Cuál es el concepto principal explicado en esta lección?',
        options: [
          'La gestión de riesgos financieros',
          'El concepto principal de la lección',
          'La normativa institucional vigente',
          'Los procesos operativos básicos',
        ],
        correctAnswer: 1,
        explanation: 'Esta es la respuesta correcta según el contenido de la lección.',
      },
      {
        type: 'true_false',
        question: '¿Es importante aplicar los conocimientos de esta lección en el trabajo diario?',
        correctAnswer: true,
        explanation: 'La aplicación práctica de los conocimientos es fundamental para el desarrollo profesional.',
      },
      {
        type: 'multiple_choice',
        question: '¿Cuál de las siguientes opciones describe mejor el objetivo de esta lección?',
        options: [
          'Proporcionar información teórica únicamente',
          'Desarrollar habilidades prácticas aplicables',
          'Cumplir un requisito administrativo',
          'Ninguna de las anteriores',
        ],
        correctAnswer: 1,
        explanation: 'El objetivo principal es desarrollar habilidades aplicables en el contexto laboral.',
      },
    ];
  }
}
