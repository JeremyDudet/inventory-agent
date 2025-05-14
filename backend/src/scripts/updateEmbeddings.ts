// backend/src/scripts/updateEmbeddings.ts
import { sql } from "drizzle-orm";
import db from "@/db";
import { inventory_items } from "@/db/schema";
import { generateEmbedding } from "@/utils/generateEmbedding";

async function updateEmbeddings() {
  try {
    console.log("Starting embedding update process...");

    // Get items without embeddings
    const items = await db
      .select()
      .from(inventory_items)
      .where(sql`${inventory_items.embedding} IS NULL`);

    if (items.length === 0) {
      console.log("No items found without embeddings.");
      return;
    }

    const batchSize = 10;
    console.log(`Found ${items.length} items without embeddings.`);

    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, i + batchSize);
      console.log(
        `Processing batch ${Math.floor(i / batchSize) + 1}/${Math.ceil(
          items.length / batchSize
        )}...`
      );

      await Promise.all(
        batch.map(async (item) => {
          try {
            // Create a descriptive text for embedding
            const textForEmbedding = item.description
              ? `${item.name} - ${item.description}`
              : item.name;

            const embedding = await generateEmbedding(textForEmbedding);

            // Use Drizzle's update method for better type safety
            await db
              .update(inventory_items)
              .set({
                embedding: sql`ARRAY[${sql.join(embedding)}]::vector(1536)`,
                updated_at: new Date().toISOString(),
              })
              .where(sql`${inventory_items.id} = ${item.id}`);

            console.log(`✓ Updated embedding for item: ${item.name}`);
          } catch (error) {
            console.error(
              `✗ Failed to update embedding for item: ${item.name}`,
              error
            );
          }
        })
      );

      if (i + batchSize < items.length) {
        console.log("Waiting 1 second before next batch...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log("\nEmbedding update process completed.");

    // Print summary
    const summary = await db.execute(sql`
      SELECT 
        COUNT(*) as total_items,
        COUNT(embedding) as items_with_embeddings,
        COUNT(*) - COUNT(embedding) as items_without_embeddings
      FROM inventory_items
    `);

    const stats = summary[0];
    console.log("\n=== Summary ===");
    console.log(`Total items: ${stats.total_items}`);
    console.log(`Items with embeddings: ${stats.items_with_embeddings}`);
    console.log(
      `Items still without embeddings: ${stats.items_without_embeddings}`
    );
  } catch (error) {
    console.error("Error in updateEmbeddings:", error);
    throw error;
  }
}

// Run the script
if (require.main === module) {
  updateEmbeddings()
    .then(() => {
      console.log("\nScript completed successfully");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\nScript failed:", error);
      process.exit(1);
    });
}

export default updateEmbeddings;
