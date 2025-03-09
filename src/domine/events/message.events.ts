import { File, Message } from '../models';

export class MessageReceivedEvent {
  constructor(
    public readonly chatId: number,
    public readonly message: Message,
    public readonly isBotReply?: boolean,
    public readonly isReply?: boolean,
    public readonly isImage?: boolean,
    public readonly file?: { fileUrl: string; file: File },
  ) {}
}

export class MessageProcessedEvent {
  constructor(
    public readonly chatId: number,
    public readonly messageId: number,
    public readonly response: Message,
  ) {}
}

export class GenerateImageEvent {
  constructor(
    public readonly chatId: number,
    public readonly messageId: number,
    public readonly prompt: string,
  ) {}
}

export class WebContentRequestEvent {
  constructor(
    public readonly chatId: number,
    public readonly messageId: number,
    public readonly url: string,
    public readonly type: 'RESUME' | 'OPINION',
    public readonly originalText: string,
  ) {}
}
