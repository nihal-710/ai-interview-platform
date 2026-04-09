import fs from 'fs'
import pdfParse from 'pdf-parse'

/**
 * Extract and clean text from a PDF file
 */
export const extractTextFromPDF = async (filePath) => {
  try {
    const buffer = fs.readFileSync(filePath)
    const data   = await pdfParse(buffer)
    const raw    = data.text || ''

    const cleaned = raw
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    console.log(`[PDF PARSER] Extracted ${cleaned.length} characters`)

    if (cleaned.length < 50) {
      throw new Error('PDF appears to be empty or unreadable.')
    }

    return cleaned.slice(0, 3000)

  } catch (error) {
    console.error('[PDF PARSER ERROR]', error.message)
    throw new Error(`PDF extraction failed: ${error.message}`)
  }
}