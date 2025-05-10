// backend/src/scripts/updateEmbeddings.ts
import { sql, eq } from "drizzle-orm";
import db from "../db";
import { inventory_items } from "../db/schema";
import { generateEmbedding } from "../utils/createEmbedding";

async function updateEmbeddings() {
  try {
    // Get items without embeddings using the correct field names
    const items = await db
      .select()
      .from(inventory_items)
      .where(sql`${inventory_items.embedding} IS NULL`);

    if (items.length === 0) {
      console.log("No items found without embeddings.");
      return;
    }

    const batchSize = 10; // Adjust based on your API rate limits
    console.log(`Found ${items.length} items without embeddings.`);

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      console.log(`Processing batch ${Math.floor(i / batchSize) + 1}...`);

      await Promise.all(
        batch.map(async (item) => {
          try {
            // Create a descriptive text for embedding that includes name and description
            const textForEmbedding = item.description
              ? `${item.name} - ${item.description}`
              : item.name;

            const embedding = await generateEmbedding(textForEmbedding);

            // Update directly using Drizzle, with the correct field name
            await db
              .update(inventory_items)
              .set({
                embedding: embedding,
                updated_at: new Date().toISOString(), // Use snake_case to match schema
              })
              .where(eq(inventory_items.id, item.id));

            console.log(`Updated embedding for item: ${item.name}`);
          } catch (error) {
            console.error(
              `Failed to update embedding for item: ${item.name}`,
              error
            );
          }
        })
      );

      // Add a delay between batches to avoid hitting rate limits
      if (i + batchSize < items.length) {
        console.log("Waiting 1 second before next batch...");
        await new Promise((resolve) => setTimeout(resolve, 1000)); // 1-second delay
      }
    }

    console.log("Embedding update process completed.");

    // Print summary
    const itemsWithEmbeddings = await db
      .select()
      .from(inventory_items)
      .where(sql`${inventory_items.embedding} IS NOT NULL`);

    const totalItems = await db.select().from(inventory_items);

    console.log(`Total items: ${totalItems.length}`);
    console.log(`Items with embeddings: ${itemsWithEmbeddings.length}`);
    console.log(
      `Items still without embeddings: ${
        totalItems.length - itemsWithEmbeddings.length
      }`
    );
  } catch (error) {
    console.error("Error in updateEmbeddings:", error);
    throw error;
  }
}

updateEmbeddings().catch((error) => {
  console.error("Error running updateEmbeddings:", error);
  process.exit(1);
});
