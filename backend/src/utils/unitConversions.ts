// backend/src/utils/unitConversions.ts
export const unitToType: Record<string, string> = {
  gallon: "volume",
  gallons: "volume",
  liters: "volume",
  liter: "volume",
  oz: "volume",
  ounces: "volume",
  ounce: "volume",
  ml: "volume",
  milliliters: "volume",
  milliliter: "volume",
  lbs: "weight",
  lb: "weight",
  pounds: "weight",
  pound: "weight",
  kg: "weight",
  g: "weight",
  piece: "count",
  pieces: "count",
  box: "count",
  boxes: "count",
  bottle: "count",
  bottles: "count",
  bag: "count",
  bags: "count",
  cup: "volume",
  cups: "volume",
  tablespoon: "volume",
  tablespoons: "volume",
  teaspoon: "volume",
  teaspoons: "volume",
  quarts: "volume",
  pints: "volume",
  quart: "volume",
  pint: "volume",
};

export const volumeConversions: Record<string, number> = {
  liters: 1, // Base unit
  liter: 1, // Base unit (singular)
  gallons: 3.78541, // Liters per gallon
  gallon: 3.78541, // Liters per gallon (singular)
  oz: 0.0295735, // Liters per ounce
  ounces: 0.0295735, // Liters per ounce (plural)
  ounce: 0.0295735, // Liters per ounce (singular)
  ml: 0.001, // Liters per milliliter
  milliliters: 0.001, // Liters per milliliter (plural)
  milliliter: 0.001, // Liters per milliliter (singular)
  cups: 0.236588, // Liters per cup
  cup: 0.236588, // Liters per cup (singular)
  tablespoons: 0.0147868, // Liters per tablespoon
  tablespoon: 0.0147868, // Liters per tablespoon (singular)
  teaspoons: 0.00492892, // Liters per teaspoon
  teaspoon: 0.00492892, // Liters per teaspoon (singular)
  quarts: 0.946353, // Liters per quart
  quart: 0.946353, // Liters per quart (singular)
  pints: 0.473176, // Liters per pint
  pint: 0.473176, // Liters per pint (singular)
};

export const weightConversions: Record<string, number> = {
  g: 1, // Base unit
  kg: 1000, // Grams per kilogram
  pounds: 453.592, // Grams per pound
  pound: 453.592, // Grams per pound (singular)
  lbs: 453.592, // Grams per pound (abbreviation)
  lb: 453.592, // Grams per pound (abbreviation singular)
};

export function getUnitType(unit: string): string {
  const normalizedUnit = unit.trim().toLowerCase();
  return unitToType[normalizedUnit] || "unknown";
}

export function convertQuantity(
  quantity: number,
  fromUnit: string,
  toUnit: string
): number {
  const fromType = getUnitType(fromUnit);
  const toType = getUnitType(toUnit);

  if (fromType !== toType) {
    throw new Error(`Incompatible units: ${fromUnit} and ${toUnit}`);
  }

  if (fromType === "count") {
    if (fromUnit !== toUnit) {
      throw new Error(
        `Cannot convert between different count units: ${fromUnit} to ${toUnit}`
      );
    }
    return quantity;
  }

  const conversions =
    fromType === "volume" ? volumeConversions : weightConversions;
  if (!conversions[fromUnit] || !conversions[toUnit]) {
    throw new Error(
      `Unknown unit: ${fromUnit} or ${toUnit} for type ${fromType}`
    );
  }

  return (quantity * conversions[fromUnit]) / conversions[toUnit];
}
