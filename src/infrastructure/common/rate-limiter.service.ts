import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class RateLimiterService {
  private lastCheck: number;
  private tokens: number;
  private readonly requestsPerSecond: number;
  private readonly checkEveryNSeconds: number;
  private readonly maxBucketSize: number;

  constructor(private readonly configService: ConfigService) {
    this.requestsPerSecond = this.configService.get<number>(
      'RATE_LIMITER_REQUESTS_PER_SECOND',
      0.25,
    );
    this.checkEveryNSeconds = this.configService.get<number>(
      'RATE_LIMITER_CHECK_EVERY_N_SECONDS',
      0.1,
    );
    this.maxBucketSize = this.configService.get<number>(
      'RATE_LIMITER_MAX_BUCKET_SIZE',
      10,
    );
    this.lastCheck = Date.now();
    this.tokens = this.maxBucketSize;
  }

  async acquire(): Promise<void> {
    while (true) {
      const now = Date.now();
      const timePassed = (now - this.lastCheck) / 1000;
      this.lastCheck = now;
      this.tokens = Math.min(
        this.maxBucketSize,
        this.tokens + timePassed * this.requestsPerSecond,
      );

      if (this.tokens >= 1) {
        this.tokens -= 1;
        break;
      }
      await new Promise((resolve) =>
        setTimeout(resolve, this.checkEveryNSeconds * 1000),
      );
    }
  }
}
