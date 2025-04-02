import { InventoryRepository } from '../repositories/InventoryRepository';
import { generateEmbedding } from '../utils/createEmbedding';

async function updateEmbeddings() {
  const repository = new InventoryRepository();
  const items = await repository.getItemsWithoutEmbeddings();
  const batchSize = 10; // Adjust based on your API rate limits
  console.log(`Found ${items.length} items without embeddings.`);

  for (let i = 0; i < items.length; i += batchSize) {
    const batch = items.slice(i, i + batchSize);
    console.log(`Processing batch ${i / batchSize + 1}...`);

    await Promise.all(
      batch.map(async (item) => {
        try {
          const embedding = await generateEmbedding(item.name);
          await repository.update(item.id, { embedding });
          console.log(`Updated embedding for item: ${item.name}`);
        } catch (error) {
          console.error(`Failed to update embedding for item: ${item.name}`, error);
        }
      })
    );

    // Add a delay between batches to avoid hitting rate limits
    if (i + batchSize < items.length) {
      await new Promise(resolve => setTimeout(resolve, 1000)); // 1-second delay
    }
  }

  console.log('Embedding update process completed.');
}

updateEmbeddings().catch(error => {
  console.error('Error running updateEmbeddings:', error);
  process.exit(1);
});