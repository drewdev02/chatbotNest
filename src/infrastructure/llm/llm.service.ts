import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GoogleGenerativeAI, type Part } from '@google/generative-ai';
import { RateLimiterService } from '../common/rate-limiter.service';
import { File, Message, MessageHistory } from '../../domine/models';
import { join } from 'path';
import { readFileSync } from 'fs';

type BotInstructions = {
  instructions: string;
  noAnswerInstructions: string;
  generateImageInstructions: string;
  preferredLanguage: string;
};

@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly isGoogleMultimodal: boolean;
  private readonly engine: GoogleGenerativeAI;
  private readonly systemInstructions: MessageHistory[];

  constructor(
    private readonly configService: ConfigService,
    private readonly rateLimiter: RateLimiterService,
  ) {
    const jsonFilePath = join('instructions.json');
    const fileContents = readFileSync(jsonFilePath, 'utf-8');
    const {
      preferredLanguage,
      noAnswerInstructions,
      instructions,
      generateImageInstructions,
    }: BotInstructions = JSON.parse(fileContents);
    const botName = this.configService.get<string>('TELEGRAM_BOT_NAME');
    const botUsername = this.configService.get<string>('TELEGRAM_BOT_USERNAME');
    const addNoAnswer = this.configService.get<boolean>('ADD_NO_ANSWER', false);
    const webuiSdApiUrl = this.configService.get<string | null>(
      'WEBUI_SD_API_URL',
    );
    const botPreferredLanguage = this.configService.get<string>(
      'PREFERRED_LANGUAGE',
      preferredLanguage,
    );
    const googleApiKey = this.configService.get<string>('GOOGLE_API_KEY');
    let botInstructions = this.configService.get<string>(
      'TELEGRAM_BOT_INSTRUCTIONS',
      instructions,
    );

    this.isGoogleMultimodal = !!googleApiKey;
    if (this.isGoogleMultimodal) {
      this.engine = new GoogleGenerativeAI(googleApiKey);
    }
    // Build system instructions
    // Add no answer instructions if configured
    if (addNoAnswer) {
      botInstructions = botInstructions + '\n' + noAnswerInstructions + '\n';
    }
    // Check if image generation is enabled
    if (webuiSdApiUrl) {
      botInstructions = botInstructions + '\n' + generateImageInstructions;
    }

    botInstructions = botInstructions
      .replace('${botName}', botName)
      .replace('${botUsername}', botUsername)
      .replace(
        '${addNoAnswer}',
        addNoAnswer ? `\n ${noAnswerInstructions}` : '',
      )
      .replace(
        '${webuiSdApiUrl}',
        webuiSdApiUrl ? generateImageInstructions : '',
      )
      .replace('${preferredLanguage}', botPreferredLanguage);

    this.systemInstructions = [
      { content: botInstructions, type: 'human' },
      { content: 'ok!', type: 'ai' },
    ];
  }

  get isImageMultimodalCapable(): boolean {
    return this.isGoogleMultimodal;
  }

  getSystemInstructions(): MessageHistory[] {
    return this.systemInstructions;
  }

  async processMessage(
    isImage: boolean,
    message: Message,
    messages: MessageHistory[],
    file?: File,
  ): Promise<MessageHistory> {
    if (isImage && this.isImageMultimodalCapable) {
      this.logger.debug(
        `Image message ${message.message_id} for chat ${message.chat.id}`,
      );
      return this.answerImageMessage({
        text: message.caption,
        imageUrl: file?.fileUrl,
        messages: messages,
      });
    } else {
      this.logger.debug(
        `Text message ${message.message_id} for chat ${message.chat.id}`,
      );
      return this.invoke(messages);
    }
  }

  async invoke(
    messages: MessageHistory[],
    image?: Part,
  ): Promise<MessageHistory> {
    this.logger.debug(
      `Invoking LLM with messages ${JSON.stringify(messages, null, 2)}`,
    );
    await this.rateLimiter.acquire();

    if (this.isGoogleMultimodal && this.engine) {
      try {
        const model = this.engine.getGenerativeModel({
          model: 'gemini-2.0-flash',
          systemInstruction: JSON.stringify(this.systemInstructions),
        });

        const result = await model.generateContent([
          JSON.stringify(messages),
          image ?? '',
        ]);

        return {
          content: result.response.text(),
          type: 'ai',
        };
      } catch (error) {
        this.logger.error(
          `Google AI API Error: ${error.message}`,
          error.stack,
          'LlmService',
        );
        return { content: 'NO_ANSWER', type: 'ai' };
      }
    } /*else if (llmConfig.openaiApiKey || llmConfig.openaiApiBaseUrl) {
      try {
        // Implementación de OpenAI API iría aquí
        // Por simplicidad, devolvemos una respuesta simulada
        return this.simulateResponse(messages);
      } catch (error) {
        this.logger.error(
          `OpenAI API Error: ${error.message}`,
          error.stack,
          'LlmService',
        );
        return { content: 'NO_ANSWER', type: 'ai' };
      }
    }*/ else {
      throw new Error('No LLM backend configured');
    }
  }

  private simulateResponse(messages: MessageHistory[]): MessageHistory {
    const lastMessage = messages[messages.length - 1];
    const content =
      typeof lastMessage.content === 'string'
        ? lastMessage.content
        : 'Complex message';
    return {
      content: `Simulated response to: ${content.substring(0, 20)}...`,
      type: 'ai',
    };
  }

  getNumTokens(text: string): number {
    // Simple approximation - real implementation would use proper tokenizer
    return Math.ceil(text.length / 4);
  }

  countTokens(messages: MessageHistory[]): number {
    const text = messages
      .map((message) => {
        if (typeof message.content === 'string') {
          return message.content;
        } else if (Array.isArray(message.content)) {
          return JSON.stringify(message.content);
        }
        return '';
      })
      .join(' ');

    return this.getNumTokens(text);
  }

  answerImageMessage(param: {
    text: string;
    imageUrl: string;
    messages: MessageHistory[];
  }): Promise<MessageHistory> {
    return new Promise((resolve, reject) => {});
  }
}
