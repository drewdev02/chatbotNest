import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class WebContentService {
  private readonly logger = new Logger(WebContentService.name);

  constructor() {}

  getWebContent(
    url: string,
    type: 'RESUME' | 'OPINION',
    query: string,
  ): string | null {
    try {
      this.logger.debug(
        `Fetching web content from ${url} for ${type}`,
        'WebContentService',
      );

      // In a real implementation, fetch and process the web content
      // This is a simplified placeholder
      const cleanQuery = this.removeUrls(query);

      return `Simulated web content ${type.toLowerCase()} for ${url} with query: ${cleanQuery}`;
    } catch (error) {
      this.logger.error(
        `Failed to process web content: ${error.message}`,
        error.stack,
        'WebContentService',
      );
      return null;
    }
  }

  extractUrl(text: string): string | null {
    const url = text.match(
      /https?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*(),]|%[0-9a-fA-F][0-9a-fA-F])+/,
    );
    return url ? url[0] : null;
  }

  private removeUrls(text: string): string {
    return text.replace(
      /https?:\/\/(?:[a-zA-Z]|[0-9]|[$-_@.&+]|[!*(),]|%[0-9a-fA-F][0-9a-fA-F])+/g,
      '',
    );
  }
}
