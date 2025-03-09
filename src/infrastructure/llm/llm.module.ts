import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';
import { CommonModule } from '../common/common.module';

@Module({
  imports: [CommonModule],
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}
