// backend/src/utils/unitConversions.ts
export const unitToType: Record<string, string> = {
    'gallon': 'volume',
    'gallons': 'volume',
    'liters': 'volume',
    'liter': 'volume',
    'oz': 'volume',
    'ounces': 'volume',
    'ounce': 'volume',
    'ml': 'volume',
    'milliliters': 'volume',
    'milliliter': 'volume',
    'lbs': 'weight',
    'lb': 'weight',
    'pounds': 'weight',
    'pound': 'weight',
    'kg': 'weight',
    'g': 'weight',
    'piece': 'count',
    'pieces': 'count',
    'box': 'count',
    'boxes': 'count',
    'bag': 'count',
    'bags': 'count',
    'cup': 'volume',
    'cups': 'volume',
    'tablespoon': 'volume',
    'tablespoons': 'volume',
    'teaspoon': 'volume',
    'teaspoons': 'volume',
    'quarts': 'volume',
    'pints': 'volume',
    'quart': 'volume',
    'pint': 'volume',
  };
  
  export const volumeConversions: Record<string, number> = {
    'liters': 1,        // Base unit
    'gallons': 3.78541, // Liters per gallon
    'oz': 0.0295735,    // Liters per ounce
    'ml': 0.001,        // Liters per milliliter
  };
  
  export const weightConversions: Record<string, number> = {
    'g': 1,          // Base unit
    'kg': 1000,      // Grams per kilogram
    'pounds': 453.592, // Grams per pound
  };
  
  export function getUnitType(unit: string): string {
    const normalizedUnit = unit.trim().toLowerCase();
    return unitToType[normalizedUnit] || 'unknown';
  }
  
  export function convertQuantity(quantity: number, fromUnit: string, toUnit: string): number {
    const fromType = getUnitType(fromUnit);
    const toType = getUnitType(toUnit);
  
    if (fromType !== toType) {
      throw new Error(`Incompatible units: ${fromUnit} and ${toUnit}`);
    }
  
    if (fromType === 'count') {
      if (fromUnit !== toUnit) {
        throw new Error(`Cannot convert between different count units: ${fromUnit} to ${toUnit}`);
      }
      return quantity;
    }
  
    const conversions = fromType === 'volume' ? volumeConversions : weightConversions;
    if (!conversions[fromUnit] || !conversions[toUnit]) {
      throw new Error(`Unknown unit: ${fromUnit} or ${toUnit} for type ${fromType}`);
    }
  
    return (quantity * conversions[fromUnit]) / conversions[toUnit];
  }