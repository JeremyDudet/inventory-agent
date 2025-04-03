// backend/src/utils/preprocessText.ts
// backend/src/utils/preprocessText.ts
export function preprocessText(text: string): string {
    text = text.toLowerCase();
    text = text.replace(/\b(the|of|a|an)\b/g, ''); // Remove stop words
  
    // Attach numbers to units
    text = text.replace(/(\d+)\s*(ounce|oz|pound|lb|liter|l|gram|g|kilo|kg|milli|ml|centi|cm|meter|m)\b/gi, '$1$2');
  
    text = text.replace(/[^a-z0-9 ]/g, ''); // Remove special characters except spaces
    text = text.trim();
    return text;
}