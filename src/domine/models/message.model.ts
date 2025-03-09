import * as Telegram from 'node-telegram-bot-api';

export interface ContentItem {
  type: string;
  text?: string;
  image_url?: string;
}

export type Message = Telegram.Message;

export interface MessageHistory {
  type: 'human' | 'ai';
  content: string | ContentItem[];
}

export interface Chat {
  id: number;
  messages: MessageHistory[];
}

export type File = Telegram.File;
