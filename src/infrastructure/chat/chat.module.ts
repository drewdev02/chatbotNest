import { Module } from '@nestjs/common';
import { InMemoryChatRepository } from './chat-in-memory.repository';
import { ChatRepository } from '../../domine/repositories';

@Module({
  providers: [{ provide: ChatRepository, useClass: InMemoryChatRepository }],
  exports: [ChatRepository],
})
export class ChatModule {}
