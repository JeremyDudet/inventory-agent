// scripts/seed-inventory.ts
import db from "@/db"; // adjust path as needed
import { inventory_items, locations } from "@/db/schema";
import { v4 as uuidv4 } from "uuid";

// Sample inventory data
const inventoryData = [
  // Food Items
  {
    category: "Food",
    name: "Flour",
    unit: "lbs",
    quantity: 50,
    threshold: 20,
    description: "All-purpose flour for baking",
  },
  {
    category: "Food",
    name: "Sugar",
    unit: "lbs",
    quantity: 30,
    threshold: 15,
    description: "White granulated sugar",
  },
  {
    category: "Food",
    name: "Salt",
    unit: "lbs",
    quantity: 20,
    threshold: 10,
    description: "Table salt",
  },
  {
    category: "Food",
    name: "Olive Oil",
    unit: "liters",
    quantity: 15,
    threshold: 5,
    description: "Extra virgin olive oil",
  },
  {
    category: "Food",
    name: "Butter",
    unit: "lbs",
    quantity: 25,
    threshold: 10,
    description: "Unsalted butter",
  },
  {
    category: "Food",
    name: "Rice",
    unit: "lbs",
    quantity: 100,
    threshold: 40,
    description: "Long grain white rice",
  },
  {
    category: "Food",
    name: "Pasta",
    unit: "lbs",
    quantity: 40,
    threshold: 20,
    description: "Assorted pasta shapes",
  },
  {
    category: "Food",
    name: "Canned Tomatoes",
    unit: "cans",
    quantity: 60,
    threshold: 25,
    description: "Whole peeled tomatoes",
  },
  {
    category: "Food",
    name: "Ground Beef",
    unit: "lbs",
    quantity: 35,
    threshold: 15,
    description: "Fresh ground beef 80/20",
  },
  {
    category: "Food",
    name: "Chicken Breast",
    unit: "lbs",
    quantity: 45,
    threshold: 20,
    description: "Boneless skinless chicken breast",
  },

  // Beverages
  {
    category: "Beverages",
    name: "Coffee Beans",
    unit: "lbs",
    quantity: 20,
    threshold: 10,
    description: "Arabica whole bean coffee",
  },
  {
    category: "Beverages",
    name: "Tea Bags",
    unit: "boxes",
    quantity: 30,
    threshold: 15,
    description: "Assorted tea bags",
  },
  {
    category: "Beverages",
    name: "Bottled Water",
    unit: "cases",
    quantity: 50,
    threshold: 20,
    description: "24-pack bottled water",
  },
  {
    category: "Beverages",
    name: "Soda",
    unit: "cases",
    quantity: 40,
    threshold: 15,
    description: "Assorted soft drinks",
  },
  {
    category: "Beverages",
    name: "Beer",
    unit: "cases",
    quantity: 25,
    threshold: 10,
    description: "Assorted beer 24-pack",
  },
  {
    category: "Beverages",
    name: "Wine",
    unit: "bottles",
    quantity: 35,
    threshold: 15,
    description: "Red and white wine selection",
  },

  // Supplies
  {
    category: "Supplies",
    name: "Paper Towels",
    unit: "rolls",
    quantity: 100,
    threshold: 40,
    description: "Commercial paper towels",
  },
  {
    category: "Supplies",
    name: "Toilet Paper",
    unit: "rolls",
    quantity: 150,
    threshold: 60,
    description: "Commercial toilet paper",
  },
  {
    category: "Supplies",
    name: "Dish Soap",
    unit: "bottles",
    quantity: 30,
    threshold: 15,
    description: "Commercial dish detergent",
  },
  {
    category: "Supplies",
    name: "Hand Soap",
    unit: "bottles",
    quantity: 25,
    threshold: 10,
    description: "Liquid hand soap",
  },
  {
    category: "Supplies",
    name: "Trash Bags",
    unit: "boxes",
    quantity: 20,
    threshold: 8,
    description: "Heavy duty trash bags",
  },
  {
    category: "Supplies",
    name: "Aluminum Foil",
    unit: "rolls",
    quantity: 15,
    threshold: 5,
    description: "Commercial aluminum foil",
  },
  {
    category: "Supplies",
    name: "Plastic Wrap",
    unit: "rolls",
    quantity: 12,
    threshold: 5,
    description: "Commercial plastic wrap",
  },

  // Equipment
  {
    category: "Equipment",
    name: "Plates",
    unit: "pieces",
    quantity: 200,
    threshold: 80,
    description: "Ceramic dinner plates",
  },
  {
    category: "Equipment",
    name: "Forks",
    unit: "pieces",
    quantity: 150,
    threshold: 60,
    description: "Stainless steel forks",
  },
  {
    category: "Equipment",
    name: "Knives",
    unit: "pieces",
    quantity: 150,
    threshold: 60,
    description: "Stainless steel knives",
  },
  {
    category: "Equipment",
    name: "Spoons",
    unit: "pieces",
    quantity: 150,
    threshold: 60,
    description: "Stainless steel spoons",
  },
  {
    category: "Equipment",
    name: "Glasses",
    unit: "pieces",
    quantity: 120,
    threshold: 50,
    description: "Water glasses",
  },
  {
    category: "Equipment",
    name: "Coffee Cups",
    unit: "pieces",
    quantity: 100,
    threshold: 40,
    description: "Ceramic coffee mugs",
  },
  {
    category: "Equipment",
    name: "Cutting Boards",
    unit: "pieces",
    quantity: 15,
    threshold: 5,
    description: "Plastic cutting boards",
  },
  {
    category: "Equipment",
    name: "Chef Knives",
    unit: "pieces",
    quantity: 10,
    threshold: 4,
    description: "Professional chef knives",
  },

  // Cleaning
  {
    category: "Cleaning",
    name: "Bleach",
    unit: "gallons",
    quantity: 10,
    threshold: 4,
    description: "Commercial bleach",
  },
  {
    category: "Cleaning",
    name: "All-Purpose Cleaner",
    unit: "bottles",
    quantity: 20,
    threshold: 8,
    description: "Multi-surface cleaner",
  },
  {
    category: "Cleaning",
    name: "Glass Cleaner",
    unit: "bottles",
    quantity: 15,
    threshold: 6,
    description: "Window and glass cleaner",
  },
  {
    category: "Cleaning",
    name: "Mop Heads",
    unit: "pieces",
    quantity: 12,
    threshold: 5,
    description: "Commercial mop heads",
  },
  {
    category: "Cleaning",
    name: "Brooms",
    unit: "pieces",
    quantity: 8,
    threshold: 3,
    description: "Commercial brooms",
  },
  {
    category: "Cleaning",
    name: "Rubber Gloves",
    unit: "pairs",
    quantity: 25,
    threshold: 10,
    description: "Heavy duty cleaning gloves",
  },

  // Medical/Safety
  {
    category: "Medical",
    name: "First Aid Kits",
    unit: "kits",
    quantity: 5,
    threshold: 2,
    description: "Complete first aid kits",
  },
  {
    category: "Medical",
    name: "Bandages",
    unit: "boxes",
    quantity: 20,
    threshold: 8,
    description: "Assorted bandages",
  },
  {
    category: "Medical",
    name: "Hand Sanitizer",
    unit: "bottles",
    quantity: 30,
    threshold: 12,
    description: "Alcohol-based hand sanitizer",
  },
  {
    category: "Medical",
    name: "Face Masks",
    unit: "boxes",
    quantity: 25,
    threshold: 10,
    description: "Disposable face masks",
  },
  {
    category: "Medical",
    name: "Disposable Gloves",
    unit: "boxes",
    quantity: 20,
    threshold: 8,
    description: "Nitrile disposable gloves",
  },
];

async function seedInventory() {
  try {
    console.log("🌱 Starting inventory seeding...");

    // First, get all locations or create a default one if none exist
    let locationResults = await db.select().from(locations);

    if (locationResults.length === 0) {
      console.log("📍 No locations found, creating default location...");
      await db.insert(locations).values({
        id: uuidv4(),
        name: "Main Warehouse",
      });
      locationResults = await db.select().from(locations);
    }

    console.log(`📍 Found ${locationResults.length} location(s)`);

    // Seed inventory for each location
    for (const location of locationResults) {
      console.log(`\n📦 Seeding inventory for location: ${location.name}`);

      for (const item of inventoryData) {
        try {
          await db.insert(inventory_items).values({
            location_id: location.id,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
            category: item.category,
            threshold: item.threshold,
            description: item.description,
            // Note: embedding would typically be generated by calling an embedding model
            // You would need to implement this based on your specific embedding service
          });
          console.log(
            `  ✅ Added: ${item.name} (${item.quantity} ${item.unit})`
          );
        } catch (error) {
          console.error(`  ❌ Error adding ${item.name}:`, error);
          // Continue with other items even if one fails
        }
      }
    }

    console.log("\n✨ Inventory seeding completed successfully!");
  } catch (error) {
    console.error("❌ Error seeding inventory:", error);
    throw error;
  }
}

// Run the seeder
seedInventory()
  .then(() => {
    console.log("🎉 Seeding process finished");
    process.exit(0);
  })
  .catch((error) => {
    console.error("💥 Seeding process failed:", error);
    process.exit(1);
  });
