import fs   from 'fs'
import path  from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname  = path.dirname(__filename)

/**
 * Extract and clean text from a PDF file
 * Using manual buffer reading compatible with ES modules
 */
export const extractTextFromPDF = async (filePath) => {
  try {
    const buffer = fs.readFileSync(filePath)

    // Dynamically import pdf-parse to bypass ES module restriction
    const pdfParseModule = await import('pdf-parse/lib/pdf-parse.js').catch(() => null)

    let pdfParse

    if (pdfParseModule?.default) {
      pdfParse = pdfParseModule.default
    } else {
      // Fallback — read raw text directly from PDF buffer
      return extractRawTextFromBuffer(buffer)
    }

    const data    = await pdfParse(buffer)
    const rawText = data.text || ''

    const cleaned = rawText
      .replace(/\r\n/g, '\n')
      .replace(/[ \t]+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim()

    if (cleaned.length < 50) {
      throw new Error('PDF appears to be empty or unreadable.')
    }

    return cleaned.slice(0, 3000)

  } catch (error) {
    throw new Error(`PDF extraction failed: ${error.message}`)
  }
}

/**
 * Fallback: extract readable strings directly from PDF binary
 */
const extractRawTextFromBuffer = (buffer) => {
  try {
    const text = buffer.toString('latin1')

    // Extract readable ASCII strings from the PDF binary
    const matches = text.match(/[\x20-\x7E]{4,}/g) || []
    const readable = matches
      .filter((s) => s.trim().length > 3)
      .filter((s) => !/^[\d\s.]+$/.test(s))
      .join(' ')
      .replace(/\s+/g, ' ')
      .trim()

    if (readable.length < 50) {
      throw new Error('Could not extract readable text from PDF.')
    }

    return readable.slice(0, 3000)

  } catch {
    throw new Error('PDF is unreadable. Please try a text-based PDF.')
  }
}