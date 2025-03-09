import { Injectable } from '@nestjs/common';
import { ChatRepository } from '../../domine/repositories';
import { Chat, MessageHistory } from '../../domine/models';

@Injectable()
export class InMemoryChatRepository extends ChatRepository {
  private chats: Record<number, Chat> = {};

  async getMessages(chatId: number): Promise<MessageHistory[]> {
    if (!this.chats[chatId]) {
      this.chats[chatId] = { id: chatId, messages: [] };
    }
    return this.chats[chatId].messages;
  }

  async saveMessage(
    chatId: string | number,
    message: MessageHistory,
  ): Promise<void> {
    if (!this.chats[chatId]) {
      this.chats[chatId] = { id: chatId, messages: [] };
    }
    this.chats[chatId].messages.push(message);
  }

  async removeLastMessage(chatId: string | number): Promise<void> {
    if (!this.chats[chatId]) {
      this.chats[chatId] = { id: chatId, messages: [] };
    } else {
      this.chats[chatId].messages.shift();
    }
  }
}
