import { Module } from '@nestjs/common';
import { TelegramModule } from '../../infrastructure/telegram/telegram.module';
import { LlmModule } from '../../infrastructure/llm/llm.module';
import { ImageGenerationModule } from '../../infrastructure/image-generation/image-generation.module';
import { WebContentModule } from '../../infrastructure/web-content/web-content.module';
import { MessageHandlerService } from './message-handler.service';
import { ChatModule } from '../../infrastructure/chat/chat.module';

@Module({
  imports: [
    TelegramModule,
    LlmModule,
    ImageGenerationModule,
    WebContentModule,
    ChatModule,
  ],
  providers: [MessageHandlerService],
})
export class MessageHandlerModule {}
