import { Module } from '@nestjs/common';
import { WebContentService } from './web-content.service';

@Module({
  providers: [WebContentService],
  exports: [WebContentService],
})
export class WebContentModule {}
