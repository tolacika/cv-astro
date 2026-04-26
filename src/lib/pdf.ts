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
    '/cv.html': {
      path: 'CV-noAvatar-Marshall_Laszlo_Toth.pdf',
    },
    '/cv.html?avatar': {
      path: 'CV-Marshall_Laszlo_Toth.pdf'
    }
  },
  launch: {
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  }
};