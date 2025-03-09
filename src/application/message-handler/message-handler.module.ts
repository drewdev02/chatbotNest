import { Module } from '@nestjs/common';
import { TelegramModule } from '../../infrastructure/telegram/telegram.module';
import { LlmModule } from '../../infrastructure/llm/llm.module';
import { ImageGenerationModule } from '../../infrastructure/image-generation/image-generation.module';
import { WebContentModule } from '../../infrastructure/web-content/web-content.module';
import { MessageHandlerService } from './message-handler.service';
import { ChatModule } from '../../infrastructure/chat/chat.module';
import { GenerateImageHandler } from './handlers/generate-image.handler';
import { WebContentResumeHandler } from './handlers/webcontent-resume.handler';
import { DefaultMessageHandler } from './handlers/default-message.handler';
import { NoAnswerHandler } from './handlers/no-answer.handler';
import { RESPONSE_HANDLERS } from './tokens';

@Module({
  imports: [
    TelegramModule,
    LlmModule,
    ImageGenerationModule,
    WebContentModule,
    ChatModule,
  ],
  providers: [
    MessageHandlerService,
    GenerateImageHandler,
    WebContentResumeHandler,
    DefaultMessageHandler,
    NoAnswerHandler,
    {
      provide: RESPONSE_HANDLERS,
      useFactory: (
        generateImageHandler: GenerateImageHandler,
        webContentResumeHandler: WebContentResumeHandler,
        defaultMessageHandler: DefaultMessageHandler,
        noAnswerHandler: NoAnswerHandler,
      ) => [
        generateImageHandler,
        webContentResumeHandler,
        defaultMessageHandler,
        noAnswerHandler,
      ],
      inject: [
        GenerateImageHandler,
        WebContentResumeHandler,
        DefaultMessageHandler,
        NoAnswerHandler,
      ],
    },
  ],
})
export class MessageHandlerModule {}
