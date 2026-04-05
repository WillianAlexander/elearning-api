export const PDF_GENERATOR_PORT = Symbol('PDF_GENERATOR_PORT');

export interface PdfGeneratorPort {
  generatePdf(html: string): Promise<Buffer>;
}
