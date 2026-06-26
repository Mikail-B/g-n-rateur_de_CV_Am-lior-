import { Module } from '@nestjs/common';
import { CvController } from './cv.controller';
import { CvPdfService } from './cv-pdf.service';

@Module({
  controllers: [CvController],
  providers: [CvPdfService],
})
export class AppModule {}
