// Simple synonym/abbreviation mapping for degrees and fields
const degreeSynonyms = [
  [/(btech|b\.tech|bachelor.?s|bsc|b\.sc|undergraduate)/i, 'bachelors'],
  [/(mtech|m\.tech|master.?s|msc|m\.sc)/i, 'masters'],
  [/(phd|doctorate|ph\.d)/i, 'phd'],
  [/(cs|computer science|computing|information technology|it)/i, 'computer science']
];

function normalizeDegreeString(str) {
  let normalized = str.toLowerCase();
  for (const [regex, canonical] of degreeSynonyms) {
    normalized = normalized.replace(regex, canonical);
  }
  // Remove extra spaces
  return normalized.replace(/\s+/g, ' ').trim();
}

module.exports = { normalizeDegreeString };
