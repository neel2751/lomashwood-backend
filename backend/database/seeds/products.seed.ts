import { DataSource } from 'typeorm';

export class ProductsSeed {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const productRepository = this.dataSource.getRepository('Product');
    const categoryRepository = this.dataSource.getRepository('Category');

    // Create categories
    const categories = [
      { name: 'Furniture', slug: 'furniture', description: 'Wooden furniture items' },
      { name: 'Decor', slug: 'decor', description: 'Home decoration items' },
      { name: 'Lighting', slug: 'lighting', description: 'Lighting fixtures' },
    ];

    for (const categoryData of categories) {
      const existingCategory = await categoryRepository.findOne({ where: { slug: categoryData.slug } });
      if (!existingCategory) {
        await categoryRepository.save(categoryRepository.create(categoryData));
      }
    }

    // Create sample products
    const products = [
      {
        name: 'Oak Dining Table',
        slug: 'oak-dining-table',
        description: 'Beautiful oak wood dining table for 6 people',
        price: 1299.99,
        categorySlug: 'furniture',
        inStock: true,
        images: ['table1.jpg', 'table2.jpg'],
      },
      {
        name: 'Wooden Wall Clock',
        slug: 'wooden-wall-clock',
        description: 'Handcrafted wooden wall clock',
        price: 89.99,
        categorySlug: 'decor',
        inStock: true,
        images: ['clock1.jpg'],
      },
      {
        name: 'Pendant Light',
        slug: 'pendant-light',
        description: 'Modern pendant lighting fixture',
        price: 199.99,
        categorySlug: 'lighting',
        inStock: false,
        images: ['light1.jpg'],
      },
    ];

    for (const productData of products) {
      const existingProduct = await productRepository.findOne({ where: { slug: productData.slug } });
      if (!existingProduct) {
        const category = await categoryRepository.findOne({ where: { slug: productData.categorySlug } });
        await productRepository.save(productRepository.create({
          ...productData,
          category,
        }));
      }
    }

    console.log('Products seed completed');
  }
}
