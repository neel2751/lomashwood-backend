import { DataSource } from 'typeorm';

export class BlogSeed {
  constructor(private dataSource: DataSource) {}

  async run(): Promise<void> {
    const blogRepository = this.dataSource.getRepository('BlogPost');
    const categoryRepository = this.dataSource.getRepository('BlogCategory');

    // Create blog categories
    const categories = [
      { name: 'Design', slug: 'design', description: 'Design inspiration and trends' },
      { name: 'Craftsmanship', slug: 'craftsmanship', description: 'Woodworking techniques' },
      { name: 'Company News', slug: 'company-news', description: 'Latest company updates' },
    ];

    for (const categoryData of categories) {
      const existingCategory = await categoryRepository.findOne({ where: { slug: categoryData.slug } });
      if (!existingCategory) {
        await categoryRepository.save(categoryRepository.create(categoryData));
      }
    }

    // Create sample blog posts
    const posts = [
      {
        title: 'The Art of Woodworking',
        slug: 'the-art-of-woodworking',
        excerpt: 'Discover the timeless craft of woodworking',
        content: 'Woodworking is an ancient craft that combines artistry with functionality...',
        categorySlug: 'craftsmanship',
        isPublished: true,
        featuredImage: 'woodworking-hero.jpg',
        tags: ['woodworking', 'craft', 'traditional'],
      },
      {
        title: 'Modern Interior Design Trends',
        slug: 'modern-interior-design-trends',
        excerpt: 'Explore the latest trends in interior design',
        content: 'Modern interior design is constantly evolving with new materials and concepts...',
        categorySlug: 'design',
        isPublished: true,
        featuredImage: 'design-trends.jpg',
        tags: ['design', 'interior', 'modern'],
      },
      {
        title: 'New Showroom Opening',
        slug: 'new-showroom-opening',
        excerpt: 'We are excited to announce our new downtown showroom',
        content: 'Join us for the grand opening of our latest showroom location...',
        categorySlug: 'company-news',
        isPublished: true,
        featuredImage: 'showroom-opening.jpg',
        tags: ['showroom', 'opening', 'event'],
      },
    ];

    for (const postData of posts) {
      const existingPost = await blogRepository.findOne({ where: { slug: postData.slug } });
      if (!existingPost) {
        const category = await categoryRepository.findOne({ where: { slug: postData.categorySlug } });
        await blogRepository.save(blogRepository.create({
          ...postData,
          category,
        }));
      }
    }

    console.log('Blog seed completed');
  }
}