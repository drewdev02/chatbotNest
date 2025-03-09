import { Injectable, Logger } from '@nestjs/common';
import { ResponseHandler } from '../../../domine/contracts';
import { Message } from '../../../domine/models';

@Injectable()
export class WebContentResumeHandler implements ResponseHandler {
  private readonly logger: Logger = new Logger(WebContentResumeHandler.name);

  constructor() {}

  canHandle(responseContent: string): boolean {
    return responseContent.startsWith('WEBCONTENT_RESUME');
  }

  async handle(
    responseContent: string,
    chatId: number,
    message: Message,
  ): Promise<void> {
    this.logger.debug(
      `WEBCONTENT_RESUME response, generating web content abstract for chat ${chatId}`,
    );
    // TODO: Implement web content abstract generation
  }
}
