import { ResponseHandler } from '../../../domine/contracts';
import { Injectable, Logger } from '@nestjs/common';
import { Message } from '../../../domine/models';

@Injectable()
export class GenerateImageHandler implements ResponseHandler {
  private readonly logger = new Logger(GenerateImageHandler.name);

  constructor() {}

  canHandle(responseContent: string): boolean {
    return responseContent.startsWith('GENERATE_IMAGE');
  }

  async handle(
    responseContent: string,
    chatId: number,
    message: Message,
  ): Promise<void> {
    this.logger.debug(
      `GENERATE_IMAGE response, generating image for chat ${chatId}`,
    );
    // TODO: Implement image generation
  }
}
