import fs from 'fs'

export const extractTextFromPDF = async (filePath) => {
  try {
    const buffer = fs.readFileSync(filePath)
    
    // Import pdf-parse lazily to avoid the test file bug
    const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js')
    
    const data    = await pdfParse(buffer)
    const raw     = data.text || ''

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