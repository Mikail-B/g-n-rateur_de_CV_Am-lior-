import { Injectable } from '@nestjs/common';
import PDFDocument from 'pdfkit';

type Theme = 'theme-classique' | 'theme-Bleu' | 'theme-Rouge';

interface CvItem {
  title: string;
  subtitle?: string;
  date?: string;
  description?: string;
}

@Injectable()
export class CvPdfService {
  async generate(body: Record<string, unknown>): Promise<Buffer> {
    const theme = this.theme(this.value(body, 'themeChoisi') || 'theme-classique');
    const doc = new PDFDocument({
      size: 'A4',
      margin: 0,
      info: {
        Title: 'CV',
        Author: this.fullName(body),
      },
    });

    const chunks: Buffer[] = [];
    doc.on('data', (chunk: Buffer) => chunks.push(chunk));

    this.renderDocument(doc, body, theme);
    doc.end();

    return new Promise((resolve, reject) => {
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);
    });
  }

  private renderDocument(doc: PDFKit.PDFDocument, body: Record<string, unknown>, theme: Theme) {
    const pageWidth = doc.page.width;
    const pageHeight = doc.page.height;
    const sideWidth = pageWidth * 0.34;
    const sideColor = this.sideColor(theme);

    doc.rect(0, 0, sideWidth, pageHeight).fill(sideColor);
    doc.fillColor('#ffffff');

    let leftY = 32;
    doc.font('Helvetica-Bold').fontSize(17).text('Informations générales', 28, leftY, {
      width: sideWidth - 46,
    });
    leftY += 42;

    doc.font('Helvetica-Bold').fontSize(23).text(this.fullName(body), 28, leftY, {
      width: sideWidth - 46,
    });
    leftY = doc.y + 10;

    leftY = this.textLine(doc, this.value(body, 'titrepro'), 28, leftY, sideWidth - 46, '#ffffff');
    leftY = this.textLine(doc, this.value(body, 'mail'), 28, leftY, sideWidth - 46, '#ffffff');
    leftY = this.textLine(doc, this.value(body, 'tel'), 28, leftY, sideWidth - 46, '#ffffff');

    leftY += 10;
    doc.font('Helvetica-Bold').fontSize(12).fillColor('#ffffff').text('Résumé professionnel', 28, leftY, {
      width: sideWidth - 46,
    });
    leftY = doc.y + 8;
    this.textLine(doc, this.value(body, 'resumerpro'), 28, leftY, sideWidth - 46, '#ffffff');

    let rightY = 32;
    const rightX = sideWidth + 28;
    const rightWidth = pageWidth - sideWidth - 56;

    rightY = this.section(doc, 'Expériences professionnelles', this.experiences(body), rightX, rightY, rightWidth);
    rightY = this.section(doc, 'Formations', this.formations(body), rightX, rightY + 8, rightWidth);
    this.section(doc, 'Compétences', this.competences(body), rightX, rightY + 8, rightWidth);
  }

  private section(doc: PDFKit.PDFDocument, title: string, items: CvItem[], x: number, y: number, width: number) {
    doc.font('Helvetica-Bold').fontSize(17).fillColor('#222222').text(title, x, y, { width });
    y = doc.y + 14;

    if (items.length === 0) {
      return y + 10;
    }

    for (const item of items) {
      doc.font('Helvetica-Bold').fontSize(12).fillColor('#222222').text(item.title, x, y, { width });
      y = doc.y + 6;
      y = this.textLine(doc, item.subtitle || '', x, y, width, '#222222');
      y = this.textLine(doc, item.date || '', x, y, width, '#222222');
      y = this.textLine(doc, item.description || '', x, y, width, '#222222');
      y += 10;
    }

    return y + 6;
  }

  private textLine(doc: PDFKit.PDFDocument, text: string, x: number, y: number, width: number, color: string) {
    if (text.trim() === '') {
      return y;
    }

    doc.font('Helvetica').fontSize(12).fillColor(color).text(text, x, y, {
      width,
      lineGap: 2,
    });

    return doc.y + 7;
  }

  private experiences(body: Record<string, unknown>): CvItem[] {
    const postes = this.values(body, 'poste');
    const entreprises = this.values(body, 'entreprise');
    const datesD = this.values(body, 'dateD');
    const datesF = this.values(body, 'dateF');
    const descriptions = this.values(body, 'Description');
    const count = Math.max(postes.length, entreprises.length, datesD.length, datesF.length, descriptions.length);

    return Array.from({ length: count }, (_, index) => ({
      title: postes[index] || '',
      subtitle: entreprises[index] || '',
      date: this.dateRange(datesD[index] || '', datesF[index] || ''),
      description: descriptions[index] || '',
    })).filter((item) => this.hasContent(item));
  }

  private formations(body: Record<string, unknown>): CvItem[] {
    const diplomes = this.values(body, 'Diplome');
    const etablissements = this.values(body, 'Etablissement');
    const starts = this.values(body, 'DatedDiplome');
    const ends = this.values(body, 'DatefDiplome');
    const descriptions = this.values(body, 'Descriptionf');
    const count = Math.max(diplomes.length, etablissements.length, starts.length, ends.length, descriptions.length);

    return Array.from({ length: count }, (_, index) => ({
      title: diplomes[index] || '',
      subtitle: etablissements[index] || '',
      date: this.dateRange(starts[index] || '', ends[index] || ''),
      description: descriptions[index] || '',
    })).filter((item) => this.hasContent(item));
  }

  private competences(body: Record<string, unknown>): CvItem[] {
    const names = this.values(body, 'NC');
    const levels = this.values(body, 'Niveau');
    const count = Math.max(names.length, levels.length);

    return Array.from({ length: count }, (_, index) => ({
      title: names[index] || '',
      subtitle: levels[index] || '',
    })).filter((item) => this.hasContent(item));
  }

  private fullName(body: Record<string, unknown>) {
    return [this.value(body, 'prenom'), this.value(body, 'Nom')].filter(Boolean).join(' ');
  }

  private value(body: Record<string, unknown>, name: string) {
    return this.values(body, name)[0] || '';
  }

  private values(body: Record<string, unknown>, name: string) {
    const raw = body[name] ?? body[`${name}[]`] ?? [];
    const values = Array.isArray(raw) ? raw : [raw];

    return values.map((item) => String(item ?? '').trim());
  }

  private hasContent(item: CvItem) {
    return [item.title, item.subtitle, item.date, item.description].some((value) => (value || '').trim() !== '');
  }

  private dateRange(start: string, end: string) {
    if (start !== '' && end !== '') {
      return `${start} - ${end}`;
    }

    return start !== '' ? start : end;
  }

  private theme(theme: string): Theme {
    return ['theme-classique', 'theme-Bleu', 'theme-Rouge'].includes(theme) ? (theme as Theme) : 'theme-classique';
  }

  private sideColor(theme: Theme) {
    if (theme === 'theme-Bleu') {
      return '#0954b6';
    }

    if (theme === 'theme-Rouge') {
      return '#b60909';
    }

    return '#000000';
  }
}
