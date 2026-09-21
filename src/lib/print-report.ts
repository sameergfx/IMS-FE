/** Browsers use the document title as the suggested Save as PDF filename. */
export function printReport(institutionName: string, report: "dailystatement" | "statement") {
  const originalTitle = document.title
  const institution = institutionName.trim().replace(/[<>:"/\\|?*\u0000-\u001f]/g, "_") || "institution"
  const restoreTitle = () => {
    document.title = originalTitle
    window.removeEventListener("afterprint", restoreTitle)
  }
  // The PDF printer supplies the .pdf extension.
  document.title = `${institution}_${report}`
  window.addEventListener("afterprint", restoreTitle, { once: true })
  try {
    window.print()
  } catch (error) {
    restoreTitle()
    throw error
  }
}
