import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { SDAPIParams } from '../../domine/models';

@Injectable()
export class ImageGenerationService {
  private readonly logger = new Logger(ImageGenerationService.name);
  private readonly sdapiUrl: string | null;
  private readonly sdapiParams: SDAPIParams | null;

  constructor(private readonly configService: ConfigService) {
    this.sdapiUrl = 'https://api.sudowrite.com';

    if (!this.sdapiUrl) {
      this.logger.warn(
        'WEBUI_SD_API_URL environment variable not set. Image generation disabled.',
        'ImageGenerationService',
      );
    }
  }

  get isEnabled(): boolean {
    return !!this.sdapiUrl;
  }

  generateImage(prompt: string): string | null {
    if (!this.sdapiUrl) {
      this.logger.warn(
        'Image generation requested but service is not enabled',
        'ImageGenerationService',
      );
      return null;
    }

    try {
      this.logger.debug(
        `Generating image with prompt: ${prompt}`,
        'ImageGenerationService',
      );

      /*const params = { ...this.sdapiParams, prompt };
      const response = await axios.post(
        `${this.sdapiUrl}/sdapi/v1/txt2img`,
        params,
      );

      if (response.status === 200 && response.data?.images?.length > 0) {
        return response.data.images[0];
      }*/

      return null;
    } catch (error) {
      this.logger.error(
        `Failed to generate image: ${error.message}`,
        error.stack,
        'ImageGenerationService',
      );
      return null;
    }
  }
}
