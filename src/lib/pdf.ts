import type { Options } from "astro-pdf";

export const pdfOptions: Options = {
  baseOptions: {
    throwOnFail: true,
    screen: true,
    pdf: {
      format: 'A4',
      printBackground: true,
    }
  },
  pages: {
    '/cv.html': 'CV-Marshall_Laszlo_Toth.pdf'
  },
  launch: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
};