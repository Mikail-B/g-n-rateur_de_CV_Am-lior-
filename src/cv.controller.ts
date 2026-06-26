import { Body, Controller, Get, Header, Post, Res } from '@nestjs/common';
import type { Response } from 'express';
import { CvPdfService } from './cv-pdf.service';

@Controller()
export class CvController {
  constructor(private readonly cvPdfService: CvPdfService) {}

  @Get()
  health() {
    return { status: 'ok' };
  }

  @Post('generate-cv')
  @Header('Content-Type', 'application/pdf')
  @Header('Content-Disposition', 'attachment; filename="mon-cv.pdf"')
  async generateCv(@Body() body: Record<string, unknown>, @Res() res: Response) {
    const pdf = await this.cvPdfService.generate(body);
    res.send(pdf);
  }
}
