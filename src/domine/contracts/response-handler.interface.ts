import { Message } from '../models';

export interface ResponseHandler {
  canHandle(responseContent: string): boolean;

  handle(
    responseContent: string,
    chatId: number,
    message: Message,
  ): Promise<void>;
}
