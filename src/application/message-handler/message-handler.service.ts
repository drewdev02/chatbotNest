import { ConfigService } from '@nestjs/config';
import { TelegramService } from '../../infrastructure/telegram/telegram.service';
import { LlmService } from '../../infrastructure/llm/llm.service';
import { ImageGenerationService } from '../../infrastructure/image-generation/image-generation.service';
import { WebContentService } from '../../infrastructure/web-content/web-content.service';
import { Injectable, Logger } from '@nestjs/common';
import { Chat, MessageHistory } from '../../domine/models';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import { MessageReceivedEvent } from '../../domine/events';
import { ChatRepository } from '../../domine/repositories';

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
  ) {
    this.contextMaxTokens = 4969;
  }

  @OnEvent('message.received') async handleMessageReceived(
    event: MessageReceivedEvent,
  ) {
    this.logger.debug(`Processing message ${JSON.stringify(event, null, 2)}`);
    const { chatId, message, isBotReply, isReply, isImage, file } = event;
    /* if (!this.chats[chatId]) {
       this.chats[chatId] = { id: chatId, messages: [] };
     }*/
    const messageText = isImage ? message.caption : message.text;
    if (!messageText) {
      this.logger.debug('Message has no text, skipping');
      return;
    }
    this.logger.debug(`Message text: ${messageText}`);

    let messageParts = `@${message.from?.username ?? message.from?.first_name ?? 'Unknown'}: `;

    if (isBotReply) {
      messageParts += `@${this.configService.get<string>('TELEGRAM_BOT_USERNAME')}: `;
    } else if (isReply && message.reply_to_message) {
      const replyToText = messageText;
      messageParts += `\n ${messageParts} said: ${replyToText}\n\n`;
    } else {
      messageParts += messageText;
    }

    await this.chatRepository.saveMessage(chatId, {
      type: 'human',
      content: messageParts,
    });

    while (
      this.llmService.countTokens(
        await this.chatRepository.getMessages(chatId),
      ) > this.contextMaxTokens
    ) {
      await this.chatRepository.removeLastMessage(chatId);
      this.logger.debug(`Chat context cleaned for chat ${chatId}`);
    }
    let response: MessageHistory;
    const messages = await this.chatRepository.getMessages(chatId);

    if (isImage && this.llmService.isImageMultimodalCapable) {
      this.logger.debug(
        `Image message ${message.message_id} for chat ${chatId}`,
      );
      response = await this.llmService.answerImageMessage({
        text: message.caption,
        imageUrl: file.fileUrl,
        messages: messages,
      });
    } else {
      this.logger.debug(
        `Text message ${message.message_id} for chat ${chatId}`,
      );
      response = await this.llmService.invoke(messages);
    }
    const responseContent =
      typeof response.content === 'string'
        ? response.content
        : JSON.stringify(response.content);
    this.logger.debug(`Response: ${responseContent}`);

    if (responseContent.startsWith('GENERATE_IMAGE')) {
      this.logger.debug(
        `GENERATE_IMAGE response, generating image for chat ${chatId}`,
      );
      //TODO: Implement image generation
    } else if (responseContent.startsWith('WEBCONTENT_RESUME')) {
      this.logger.debug(
        `WEBCONTENT_RESUME response, generating web content abstract for chat ${chatId}`,
      );
      //TODO: Implement web content abstract generation
    } else if (responseContent.startsWith('WEBCONTENT_OPINION')) {
      this.logger.debug(
        `WEBCONTENT_OPINION response, generating web content opinion for chat ${chatId}`,
      );
      //TODO: Implement web content opinion generation
    } else if (!responseContent.includes('NO_ANSWER')) {
      this.logger.debug(`Sending response for chat ${chatId}`);
      this.eventEmitter.emitAsync('send.message', {
        chat: chatId,
        text: responseContent,
        reply_to_message_id: message.message_id,
      });
    } else {
      this.logger.debug(`No answer for chat ${chatId}`);
      const emojis = ['😐', '😶', '😳', '😕', '😑'];
      const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
      this.eventEmitter.emitAsync('send.message', {
        chat: chatId,
        text: randomEmoji,
        reply_to_message_id: message.message_id,
      });
    }
    await this.chatRepository.saveMessage(chatId, {
      content: responseContent,
      type: 'ai',
    });
  }
}
