import { Injectable, Logger } from '@nestjs/common';
import { ResponseHandler } from '../../../domine/contracts';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Message } from '../../../domine/models';

@Injectable()
export class DefaultMessageHandler implements ResponseHandler {
  private readonly logger: Logger = new Logger(DefaultMessageHandler.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  canHandle(responseContent: string): boolean {
    return !responseContent.includes('NO_ANSWER');
  }

  async handle(
    responseContent: string,
    chatId: number,
    message: Message,
  ): Promise<void> {
    this.logger.debug(`Sending response for chat ${chatId}`);
    await this.eventEmitter.emitAsync('send.message', {
      chat: chatId,
      text: responseContent,
      reply_to_message_id: message.message_id,
    });
  }
}
