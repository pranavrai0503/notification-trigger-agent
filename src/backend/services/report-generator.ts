import Handlebars from 'handlebars';
import fs from 'fs/promises';
import path from 'path';
import { TestSession, TestStatus } from '../types/test-session';

export interface Screenshot {
  phase: string;
  base64: string;
  mimeType?: string;
}

export interface TestReport {
  sessionId: string;
  status: TestStatus;
  duration: number;
  phases: Array<{
    name: string;
    status: TestStatus;
    durationMs: number;
    error?: string;
  }>;
  screenshots: Screenshot[];
  generatedAt: string;
  config: unknown;
  logs?: unknown;
}

/**
 * Generates JSON and HTML reports from completed test sessions.
 */
export class ReportGenerator {
  /**
   * Generates a structured JSON report from a TestSession.
   * @param session - Completed TestSession
   */
  generateJSON(session: TestSession): TestReport {
    const duration =
      session.completedAt && session.startedAt
        ? session.completedAt.getTime() - session.startedAt.getTime()
        : 0;

    return {
      sessionId: session.id,
      status: session.status,
      duration,
      phases: session.phases.map((p) => ({
        name: p.phase,
        status: p.status,
        durationMs: p.durationMs ?? 0,
        error: p.error,
      })),
      screenshots: session.screenshots.map((s, i) => ({
        phase: `screenshot_${i}`,
        base64: s,
        mimeType: 'image/png',
      })),
      generatedAt: new Date().toISOString(),
      config: session.config,
      logs: session.logs,
    };
  }

  /**
   * Generates an HTML report from a TestSession using a Handlebars template.
   * @param session - Completed TestSession
   */
  async generateHTML(session: TestSession): Promise<string> {
    const templatePath = path.join(__dirname, '../templates/report.html.hbs');
    const templateSource = await fs.readFile(templatePath, 'utf8');
    const template = Handlebars.compile(templateSource);

    const report = this.generateJSON(session);
    const screenshots: Screenshot[] = report.screenshots;
    const html = template({ report, session });

    return this.embedScreenshots(html, screenshots);
  }

  /**
   * Embeds base64 screenshots into an HTML report string.
   * @param html - HTML string
   * @param screenshots - Array of Screenshot objects
   */
  embedScreenshots(html: string, screenshots: Screenshot[]): string {
    let result = html;
    screenshots.forEach((screenshot, index) => {
      const placeholder = `{{screenshot_${index}}}`;
      const mimeType = screenshot.mimeType ?? 'image/png';
      const dataUrl = `data:${mimeType};base64,${screenshot.base64}`;
      result = result.replace(
        placeholder,
        `<img src="${dataUrl}" alt="Screenshot ${index + 1}" />`
      );
    });
    return result;
  }
}
