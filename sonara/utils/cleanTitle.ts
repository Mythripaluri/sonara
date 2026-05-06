export function decodeHtmlEntities(text: string) {
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

export function normalizeTrack(rawTitle: string) {
  const decoded = decodeHtmlEntities(rawTitle);

  // Remove common YouTube junk
  let cleaned = decoded
    .replace(/\(Official.*?\)/gi, "")
    .replace(/\[Official.*?\]/gi, "")
    .replace(/Official MV/gi, "")
    .replace(/Official Video/gi, "")
    .replace(/Official Audio/gi, "")
    .replace(/Lyrics/gi, "")
    .replace(/Color Coded/gi, "")
    .replace(/M\/V/gi, "")
    .replace(/\s+/g, " ")
    .trim();

  let artist = "";
  let title = cleaned;

  // TWICE "What is Love?"
  // const quoteMatch = cleaned.match(/^(.+?)["'](.+?)["']/);
  const quoteMatch = cleaned.match(/^(.+?)"(.+?)"/);
  
  if (quoteMatch) {
    artist = quoteMatch[1].trim();
    title = quoteMatch[2].trim();
  }

  // SEVENTEEN - Super
  else if (cleaned.includes(" - ")) {
    const parts = cleaned.split(" - ");
    artist = parts[0].trim();
    title = parts.slice(1).join(" - ").trim();
  }

  return {
    title,
    artist,
  };
}