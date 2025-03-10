import { ConfigService } from '@nestjs/config';
import { TelegramService } from '../../infrastructure/telegram/telegram.service';
import { LlmService } from '../../infrastructure/llm/llm.service';
import { ImageGenerationService } from '../../infrastructure/image-generation/image-generation.service';
import { WebContentService } from '../../infrastructure/web-content/web-content.service';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { MessageHistory } from '../../domine/models';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { MessageReceivedEvent } from '../../domine/events';
import { ChatRepository } from '../../domine/repositories';
import { ResponseHandler } from '../../domine/contracts';
import { RESPONSE_HANDLERS } from './tokens';

@Injectable()
export class MessageHandlerService {
  private readonly logger = new Logger(MessageHandlerService.name);
  private readonly contextMaxTokens: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly telegramService: TelegramService,
    private readonly llmService: LlmService,
    private readonly imageGenerationService: ImageGenerationService,
    private readonly webContentService: WebContentService,
    private readonly eventEmitter: EventEmitter2,
    private readonly chatRepository: ChatRepository,
    @Inject(RESPONSE_HANDLERS)
    private readonly handlers: ResponseHandler[],
  ) {
    this.contextMaxTokens = 4969;
  }

  @OnEvent('message.received')
  async handleMessageReceived(event: MessageReceivedEvent) {
    this.logger.debug(`Processing message ${JSON.stringify(event, null, 2)}`);
    const { chatId, message, isBotReply, isReply, isImage, file } = event;

    const messageText = isImage ? message.caption : message.text;

    this.logger.debug(`Message text: ${messageText}`);

    let messageParts = `@${message.from?.username ?? message.from?.first_name ?? 'Unknown'}: `;

    if (isBotReply) {
      messageParts += `@${this.configService.get<string>('TELEGRAM_BOT_USERNAME')}: `;
    } else if (isReply) {
      messageParts += `\n ${messageParts} said: ${messageText}\n\n`;
    } else {
      messageParts += messageText;
    }

    await this.chatRepository.saveMessage(chatId, {
      type: 'human',
      content: messageParts,
    });

    await this.cleanChatContext(chatId);

    const response: MessageHistory = await this.llmService.processMessage(
      isImage,
      message,
      await this.chatRepository.getMessages(chatId),
      file,
    );

    const responseContent = this.convertToString(response.content);

    this.logger.debug(`Response: ${responseContent}`);

    for (const handler of this.handlers) {
      if (handler.canHandle(responseContent)) {
        await handler.handle(responseContent, chatId, message);
        break;
      }
    }
    await this.chatRepository.saveMessage(chatId, {
      content: responseContent,
      type: 'ai',
    });
  }

  convertToString(responseContent: any): string {
    if (typeof responseContent === 'string') {
      return responseContent;
    }
    try {
      const res = JSON.parse(responseContent);
      if ('content' in res) {
        return res.content;
      }
    } catch (e) {}
    return JSON.stringify(responseContent);
  }

  async cleanChatContext(chatId: string | number): Promise<void> {
    while (
      this.llmService.countTokens(
        await this.chatRepository.getMessages(chatId),
      ) > this.contextMaxTokens
    ) {
      await this.chatRepository.removeLastMessage(chatId);
      this.logger.debug(`Chat context cleaned for chat ${chatId}`);
    }
  }
}
