import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventEmitter2, OnEvent } from '@nestjs/event-emitter';
import * as TelegramBot from 'node-telegram-bot-api';
import { MessageReceivedEvent } from '../../domine/events';
import { ParseMode } from 'node-telegram-bot-api';

@Injectable()
export class TelegramService implements OnModuleInit {
  private readonly logger = new Logger(TelegramService.name);
  private readonly bot: TelegramBot;
  private readonly botToken: string;
  private readonly botUsername: string;
  private readonly botName: string;
  private readonly allowedChatIds: string[];

  constructor(
    private readonly cs: ConfigService,
    private readonly eventEmitter: EventEmitter2,
  ) {
    this.botToken = this.cs.getOrThrow<string>('TELEGRAM_BOT_TOKEN');
    this.botUsername = this.cs.getOrThrow<string>('TELEGRAM_BOT_USERNAME');
    this.botName = this.cs.getOrThrow<string>('TELEGRAM_BOT_NAME');
    this.allowedChatIds = [];
    this.bot = new TelegramBot(this.botToken, { polling: true });
  }

  onModuleInit() {
    this.setupMessageHandler();
    this.logger.log('Telegram bot initialized');
  }

  private setupMessageHandler() {
    this.bot.on('message', (message) => {
      const chatId = message.chat.id;

      if (
        false
        /*this.allowedChatIds.length &&
        !this.allowedChatIds.includes(chatId.toString())*/
      ) {
        this.logger.debug(`Chat ${chatId} not allowed`);
        return;
      }

      this.logger.debug(`Chat ${chatId} allowed`);

      const messageText = this.getMessageText(message);

      if (
        !(
          message.chat.type === 'private' || // Direct messages to the bot
          messageText?.includes(`@${this.botUsername}`) ||
          messageText?.toLowerCase().includes(this.botName.toLowerCase()) ||
          this.isBotReply(message)
        )
      ) {
        this.logger.debug(`Message ${message.message_id} ignored`);
      } else {
        this.logger.debug(`Message ${message.message_id} will be processed`);

        // Create and emit the event
        const event: MessageReceivedEvent = {
          chatId: chatId,
          message: message,
          isBotReply: this.isBotReply(message),
          isReply: this.isReply(message),
        };

        this.eventEmitter.emit('message.received', event);
      }
    });
  }

  private isBotReply(message: TelegramBot.Message): boolean {
    return !!(
      message.reply_to_message &&
      message.reply_to_message.from &&
      message.reply_to_message.from.username === this.botUsername
    );
  }

  private getMessageText(message?: TelegramBot.Message): string | undefined {
    if (!message) return undefined;
    return this.isImage(message) ? message.caption : message.text;
  }

  private isImage(message: TelegramBot.Message): boolean {
    return !!message.photo;
  }

  private getMessageFrom(message?: TelegramBot.Message): string {
    if (!message) return 'Unknown';
    return message.from?.username ?? message.from?.first_name ?? 'Unknown';
  }

  async sendText(
    chatId: number,
    text: string,
    replyToMessageId?: number,
  ): Promise<void> {
    try {
      if (text.length > 4096) {
        const chunks = this.chunkText(text);
        for (const chunk of chunks) {
          await this.bot.sendMessage(chatId, chunk, {
            reply_to_message_id: replyToMessageId,
            parse_mode: 'Markdown',
          });
        }
      } else {
        await this.bot.sendMessage(chatId, text, {
          reply_to_message_id: replyToMessageId,
          parse_mode: 'Markdown',
        });
      }
      this.logger.debug(`Sent response to chat ${chatId}`, 'TelegramService');
    } catch (error) {
      this.logger.error(
        `Failed to send response with Markdown: ${error?.message}`,
        error.stack,
      );
      try {
        await this.bot.sendMessage(chatId, text, {
          reply_to_message_id: replyToMessageId,
        });
      } catch (fallbackError) {
        this.logger.error(
          `Failed to send plain text response: ${fallbackError.message}`,
          fallbackError.stack,
          'TelegramService',
        );
      }
    }
  }

  async sendPhoto(
    chatId: number,
    imageBuffer: Buffer,
    replyToMessageId?: number,
  ): Promise<void> {
    try {
      await this.bot.sendPhoto(chatId, imageBuffer, {
        reply_to_message_id: replyToMessageId,
      });
      this.logger.debug(`Sent image to chat ${chatId}`, 'TelegramService');
    } catch (error) {
      this.logger.error(
        `Failed to send image: ${error.message}`,
        error.stack,
        'TelegramService',
      );
    }
  }

  async getImageUrl(fileId: string): Promise<string> {
    const file = await this.bot.getFile(fileId);
    return `https://api.telegram.org/file/bot${this.botToken}/${file.file_path}`;
  }

  private chunkText(text: string, limit: number = 4096): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      let end = start + limit;

      if (end < text.length) {
        // Try to cut at the last space within the limit
        const lastSpace = text.lastIndexOf(' ', end);
        if (lastSpace > start) {
          end = lastSpace;
        }
      }

      chunks.push(text.substring(start, end).trim());
      start = end;
    }

    return chunks;
  }

  private isReply(message: TelegramBot.Message) {
    return !!message.reply_to_message;
  }

  cleanStandardMessage(messageText: string): string {
    const replace = `@${this.botUsername}: `;
    if (messageText.startsWith(replace)) {
      return messageText.substring(replace.length);
    }
    return messageText;
  }

  @OnEvent('send.message')
  async sendMessage(data: {
    chat: TelegramBot.ChatId;
    text: string;
    reply_to_message_id?: number;
  }) {
    // this.logger.debug(`Sending message data: ${JSON.stringify(data, null, 2)}`);

    const cleanedText = this.cleanStandardMessage(data.text);
    const parseModes: ParseMode[] = ['Markdown', 'MarkdownV2', undefined];

    try {
      await this.bot.sendChatAction(data.chat, 'typing');

      for (const parseMode of parseModes) {
        try {
          await this.bot.sendMessage(data.chat, cleanedText, {
            parse_mode: parseMode,
            reply_to_message_id: data.reply_to_message_id,
          });
          return;
        } catch (error) {
          this.logger.warn(
            `Failed to send message with parse mode '${parseMode ?? 'None'}': ${error.message}`,
          );
        }
      }
    } catch (e) {
      this.logger.error(
        `Unexpected error while sending message: ${e.message}`,
        e.stack,
      );
    }
  }
}
