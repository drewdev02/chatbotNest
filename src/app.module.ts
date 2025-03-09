import { Module } from '@nestjs/common';
import { EventEmitterModule } from '@nestjs/event-emitter';
import { ConfigModule } from '@nestjs/config';
import { MessageHandlerModule } from './application/message-handler/message-handler.module';
import { CommonModule } from './infrastructure/common/common.module';
import { ImageGenerationModule } from './infrastructure/image-generation/image-generation.module';
import { LlmModule } from './infrastructure/llm/llm.module';
import { TelegramModule } from './infrastructure/telegram/telegram.module';
import { WebContentModule } from './infrastructure/web-content/web-content.module';
import { ChatModule } from './infrastructure/chat/chat.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    EventEmitterModule.forRoot(),
    MessageHandlerModule,
    CommonModule,
    ImageGenerationModule,
    LlmModule,
    TelegramModule,
    WebContentModule,
    ChatModule,
  ],
})
export class AppModule {}
