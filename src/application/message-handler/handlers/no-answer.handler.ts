import { ResponseHandler } from '../../../domine/contracts';
import { Injectable, Logger } from '@nestjs/common';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { Message } from '../../../domine/models';

@Injectable()
export class NoAnswerHandler implements ResponseHandler {
  private readonly logger: Logger = new Logger(NoAnswerHandler.name);

  constructor(private readonly eventEmitter: EventEmitter2) {}

  canHandle(responseContent: string): boolean {
    return responseContent.includes('NO_ANSWER');
  }

  async handle(
    responseContent: string,
    chatId: number,
    message: Message,
  ): Promise<void> {
    this.logger.debug(`No answer for chat ${chatId}`);
    const emojis = ['😐', '😶', '😳', '😕', '😑'];
    const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
    await this.eventEmitter.emitAsync('send.message', {
      chat: chatId,
      text: randomEmoji,
      reply_to_message_id: message.message_id,
    });
  }
}
