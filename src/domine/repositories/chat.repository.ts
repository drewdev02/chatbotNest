import { MessageHistory } from '../models';

export abstract class ChatRepository {
  abstract getMessages(chatId: number): Promise<MessageHistory[]>;

  abstract saveMessage(
    chatId: string | number,
    message: MessageHistory,
  ): Promise<void>;

  abstract removeLastMessage(chatId: string | number): Promise<void>;
}
