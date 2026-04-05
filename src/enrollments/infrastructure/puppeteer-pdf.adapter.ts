import { Injectable } from '@nestjs/common';

import type { PdfGeneratorPort } from '../domain/ports/pdf-generator.port';

@Injectable()
export class PuppeteerPdfAdapter implements PdfGeneratorPort {
  async generatePdf(html: string): Promise<Buffer> {
    // Dynamic import avoids issues with Jest module resolution
    const puppeteer = await import('puppeteer');
    const browser = await puppeteer.default.launch({
      headless: true,
      args: [
        '--no-sandbox',           // Required in Docker containers
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage', // Prevents /dev/shm issues in Docker
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-default-apps',
        '--no-first-run',
      ],
    });

    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });

      const pdfBuffer = await page.pdf({
        format: 'A4',
        landscape: true,
        printBackground: true,
        margin: { top: '0', right: '0', bottom: '0', left: '0' },
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await browser.close();
    }
  }
}
