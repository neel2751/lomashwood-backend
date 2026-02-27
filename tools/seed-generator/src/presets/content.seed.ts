import { PrismaClient } from "@prisma/client";
import { fakerEN as faker } from "../faker.config";
import { randomItem, randomPastDate, randomBoolean } from "../faker.config";
import { generateId, generateTimestamps, generateSlug } from "../generate";

const prisma = new PrismaClient();

async function seedHomeSlider(): Promise<void> {
  const slides = [
    {
      title: "Beautifully Designed Kitchens",
      description: "Transform your home with a stunning new kitchen. Book a free consultation today.",
      imageUrl: "https://cdn.lomashwood.co.uk/slider/kitchen-hero-1.jpg",
      buttonText: "Explore Kitchens",
      buttonLink: "/kitchens",
      sortOrder: 1,
      isActive: true,
    },
    {
      title: "Fitted Bedrooms That Inspire",
      description: "Create your dream bedroom with our bespoke fitted furniture solutions.",
      imageUrl: "https://cdn.lomashwood.co.uk/slider/bedroom-hero-1.jpg",
      buttonText: "Explore Bedrooms",
      buttonLink: "/bedrooms",
      sortOrder: 2,
      isActive: true,
    },
    {
      title: "Up to 50% Off This Season",
      description: "Discover incredible savings across our entire kitchen and bedroom ranges.",
      imageUrl: "https://cdn.lomashwood.co.uk/slider/sale-hero-1.jpg",
      buttonText: "View Offers",
      buttonLink: "/offers",
      sortOrder: 3,
      isActive: true,
    },
    {
      title: "Book a Free Design Consultation",
      description: "Our expert designers will create the perfect space tailored to your lifestyle.",
      imageUrl: "https://cdn.lomashwood.co.uk/slider/consultation-hero-1.jpg",
      buttonText: "Book Now",
      buttonLink: "/book-appointment",
      sortOrder: 4,
      isActive: true,
    },
  ];

  for (const slide of slides) {
    await prisma.homeSlider.create({
      data: {
        id: generateId(),
        ...slide,
        ...generateTimestamps(),
      },
    });
  }

  console.log(`✓ Seeded ${slides.length} home slider items`);
}

async function seedBlogs(): Promise<void> {
  const categories = [
    "Kitchen Design",
    "Bedroom Design",
    "Interior Tips",
    "Inspiration",
    "How-To Guides",
    "Trends",
  ];

  const blogPosts = [
    {
      title: "10 Kitchen Design Trends for 2024",
      excerpt: "Discover the hottest kitchen design trends that are defining modern homes this year.",
      content: faker.lorem.paragraphs(8, "\n\n"),
      category: "Kitchen Design",
      tags: ["trends", "kitchen", "2024", "design"],
      isPublished: true,
    },
    {
      title: "How to Choose the Perfect Kitchen Colour Scheme",
      excerpt: "Choosing the right colours for your kitchen can transform the entire feel of the space.",
      content: faker.lorem.paragraphs(6, "\n\n"),
      category: "Kitchen Design",
      tags: ["colours", "kitchen", "tips"],
      isPublished: true,
    },
    {
      title: "Maximising Space in Small Bedrooms",
      excerpt: "Expert tips and clever storage solutions to make the most of your bedroom space.",
      content: faker.lorem.paragraphs(7, "\n\n"),
      category: "Bedroom Design",
      tags: ["storage", "bedroom", "small spaces"],
      isPublished: true,
    },
    {
      title: "The Ultimate Guide to Fitted Wardrobes",
      excerpt: "Everything you need to know about fitted wardrobes, from planning to installation.",
      content: faker.lorem.paragraphs(10, "\n\n"),
      category: "How-To Guides",
      tags: ["wardrobes", "bedroom", "guide"],
      isPublished: true,
    },
    {
      title: "Handleless Kitchens: A Design Revolution",
      excerpt: "Sleek, modern, and incredibly functional – handleless kitchens have become one of the most popular styles.",
      content: faker.lorem.paragraphs(5, "\n\n"),
      category: "Kitchen Design",
      tags: ["handleless", "modern", "kitchen"],
      isPublished: true,
    },
    {
      title: "Shaker Kitchens: Timeless Elegance",
      excerpt: "The shaker kitchen style has been popular for centuries – and for good reason.",
      content: faker.lorem.paragraphs(6, "\n\n"),
      category: "Inspiration",
      tags: ["shaker", "classic", "kitchen"],
      isPublished: true,
    },
    {
      title: "How to Plan Your Dream Bedroom",
      excerpt: "A step-by-step guide to planning the perfect fitted bedroom from scratch.",
      content: faker.lorem.paragraphs(8, "\n\n"),
      category: "How-To Guides",
      tags: ["planning", "bedroom", "guide"],
      isPublished: true,
    },
    {
      title: "Kitchen Worktop Materials: A Complete Guide",
      excerpt: "From granite to quartz to wood – we compare the most popular kitchen worktop materials.",
      content: faker.lorem.paragraphs(7, "\n\n"),
      category: "Kitchen Design",
      tags: ["worktops", "materials", "kitchen"],
      isPublished: true,
    },
    {
      title: "Interior Design Trends: Biophilic Design",
      excerpt: "Bringing nature indoors is one of the most significant interior design trends of the decade.",
      content: faker.lorem.paragraphs(5, "\n\n"),
      category: "Trends",
      tags: ["biophilic", "nature", "trends", "interior"],
      isPublished: true,
    },
    {
      title: "Open Plan Living: Combining Kitchen and Dining",
      excerpt: "Open plan kitchen-dining spaces continue to be the most desirable layout in modern homes.",
      content: faker.lorem.paragraphs(6, "\n\n"),
      category: "Interior Tips",
      tags: ["open plan", "kitchen", "dining", "layout"],
      isPublished: false,
    },
  ];

  const adminUser = await prisma.user.findFirst({ where: { role: "ADMIN" } });

  for (const post of blogPosts) {
    const createdAt = randomPastDate(365);
    const slug = generateSlug(post.title);

    await prisma.blog.create({
      data: {
        id: generateId(),
        title: post.title,
        slug,
        excerpt: post.excerpt,
        content: post.content,
        category: post.category,
        tags: post.tags,
        featuredImageUrl: `https://cdn.lomashwood.co.uk/blog/${slug}.jpg`,
        isPublished: post.isPublished,
        publishedAt: post.isPublished ? createdAt : null,
        authorId: adminUser?.id ?? null,
        metaTitle: post.title,
        metaDescription: post.excerpt,
        createdAt,
        updatedAt: createdAt,
      },
    });
  }

  for (let i = 0; i < 20; i++) {
    const title = faker.lorem.sentence(randomItem([4, 5, 6, 7])).replace(".", "");
    const slug = generateSlug(`${title}-${i}`);
    const createdAt = randomPastDate(365);
    const isPublished = randomBoolean(0.7);

    await prisma.blog.create({
      data: {
        id: generateId(),
        title,
        slug,
        excerpt: faker.lorem.sentences(2),
        content: faker.lorem.paragraphs(randomItem([4, 5, 6, 7, 8]), "\n\n"),
        category: randomItem(categories),
        tags: [faker.lorem.word(), faker.lorem.word(), faker.lorem.word()],
        featuredImageUrl: `https://cdn.lomashwood.co.uk/blog/post-${i + 1}.jpg`,
        isPublished,
        publishedAt: isPublished ? createdAt : null,
        authorId: adminUser?.id ?? null,
        metaTitle: title,
        metaDescription: faker.lorem.sentences(2),
        createdAt,
        updatedAt: createdAt,
      },
    });
  }

  const total = await prisma.blog.count();
  console.log(`✓ Seeded ${total} blog posts`);
}

async function seedMediaWall(): Promise<void> {
  const items = [
    {
      title: "Luxury Kitchen Transformation",
      description: "A complete kitchen renovation featuring our premium handleless range in Anthracite Grey.",
      backgroundImageUrl: "https://cdn.lomashwood.co.uk/media-wall/bg-kitchen-1.jpg",
      callToActionText: "View Project",
      callToActionLink: "/inspiration",
      isActive: true,
      sortOrder: 1,
    },
    {
      title: "Stunning Fitted Bedroom",
      description: "Bespoke sliding wardrobe installation in our Ivory White finish with interior LED lighting.",
      backgroundImageUrl: "https://cdn.lomashwood.co.uk/media-wall/bg-bedroom-1.jpg",
      callToActionText: "View Project",
      callToActionLink: "/inspiration",
      isActive: true,
      sortOrder: 2,
    },
    {
      title: "Modern Shaker Kitchen",
      description: "A classic shaker kitchen in Sage Green with a butler's sink and exposed shelving.",
      backgroundImageUrl: "https://cdn.lomashwood.co.uk/media-wall/bg-kitchen-2.jpg",
      callToActionText: "Get Inspired",
      callToActionLink: "/inspiration",
      isActive: true,
      sortOrder: 3,
    },
    {
      title: "Walk-In Wardrobe Design",
      description: "Custom walk-in wardrobe solution maximising a corner space in a master bedroom.",
      backgroundImageUrl: "https://cdn.lomashwood.co.uk/media-wall/bg-bedroom-2.jpg",
      callToActionText: "Learn More",
      callToActionLink: "/bedrooms",
      isActive: true,
      sortOrder: 4,
    },
  ];

  for (const item of items) {
    const mediaWall = await prisma.mediaWall.create({
      data: {
        id: generateId(),
        ...item,
        ...generateTimestamps(),
      },
    });

    const imageCount = randomItem([3, 4, 5]);
    for (let i = 0; i < imageCount; i++) {
      await prisma.mediaWallImage.create({
        data: {
          id: generateId(),
          mediaWallId: mediaWall.id,
          url: `https://cdn.lomashwood.co.uk/media-wall/${mediaWall.id}-${i + 1}.jpg`,
          altText: `${item.title} - Image ${i + 1}`,
          sortOrder: i + 1,
        },
      });
    }
  }

  console.log(`✓ Seeded ${items.length} media wall items`);
}

async function seedFinanceContent(): Promise<void> {
  await prisma.financeContent.upsert({
    where: { id: "finance-main" },
    update: {},
    create: {
      id: "finance-main",
      title: "Finance Your New Kitchen or Bedroom",
      description: "Spread the cost of your dream kitchen or bedroom with our flexible finance options. We work with a panel of lenders to offer competitive rates.",
      content: `## Why Choose Finance?\n\nPurchasing a new kitchen or bedroom is one of the most significant investments you can make in your home. Our flexible finance options make it easy to spread the cost and get the kitchen or bedroom you really want – not just the one you can afford today.\n\n## Finance Options Available\n\n### 0% Interest-Free Credit\nSpread the cost over 12, 24, or 36 months with zero interest. Subject to status and minimum order value.\n\n### Buy Now, Pay Later\nOrder today and don't pay a penny for up to 12 months. Perfect if you're planning ahead.\n\n### Low APR Finance\nFor larger purchases, we offer competitive fixed-rate finance from 9.9% APR over 3–7 years.\n\n## How to Apply\n\nApplying for finance is quick, easy, and can be done in store or online. Decisions are usually made within minutes, and our team will guide you through the entire process.\n\n## Representative Example\n\nCredit amount: £8,000. Term: 48 months. Interest rate: 9.9% p.a. (fixed). Monthly repayments: £199.20. Total amount payable: £9,561.60. Representative APR: 9.9%.\n\n*Finance is subject to status and affordability checks. Not all applicants will be accepted.*`,
      isActive: true,
      ...generateTimestamps(),
    },
  });

  console.log("✓ Seeded finance content");
}

async function seedReviews(): Promise<void> {
  const reviewTexts = [
    "Absolutely delighted with our new kitchen from Lomash Wood. The quality is exceptional and the fitters were professional and tidy throughout. Would highly recommend!",
    "Our fitted bedroom has completely transformed the room. Maximised every inch of space and looks stunning. The design consultation was really helpful.",
    "From start to finish, the process was seamless. The design team listened to exactly what we wanted and delivered beyond our expectations.",
    "The quality of the kitchen units is outstanding. Six months on and everything still looks as good as the day it was installed.",
    "We visited the showroom and were immediately impressed by the range of styles on display. The staff were knowledgeable and not at all pushy.",
    "Our new bedroom furniture is beautiful. The wardrobe interior has doubled our storage space. Excellent service from start to finish.",
    "The installation team were fantastic – professional, efficient, and left the house spotless. The kitchen looks incredible.",
    "Lomash Wood transformed our dated kitchen into something we're truly proud of. Every detail was perfect.",
    "We've had our kitchen for two years now and it still looks brand new. Excellent quality and great service.",
    "The whole process from design consultation to installation was professional and stress-free. Couldn't be happier!",
  ];

  const names = [
    "Sarah T.", "James M.", "Emma W.", "David H.", "Claire B.",
    "Michael P.", "Rachel S.", "Tom K.", "Lisa N.", "Andrew F.",
    "Helen D.", "Robert C.", "Karen L.", "Paul J.", "Amanda G.",
  ];

  const users = await prisma.user.findMany({
    where: { role: "CUSTOMER" },
    select: { id: true },
    take: 20,
  });

  for (let i = 0; i < 40; i++) {
    const userId = users.length > 0 && randomBoolean(0.6) ? randomItem(users).id : null;
    const rating = randomItem([4, 4, 5, 5, 5, 5, 3]);
    const createdAt = randomPastDate(730);

    await prisma.review.create({
      data: {
        id: generateId(),
        userId,
        customerName: randomItem(names),
        customerLocation: `${randomItem(["London", "Manchester", "Birmingham", "Leeds", "Bristol", "Sheffield"])}`,
        rating,
        content: reviewTexts[i % reviewTexts.length],
        imageUrl: randomBoolean(0.3) ? `https://cdn.lomashwood.co.uk/reviews/review-${i + 1}.jpg` : null,
        videoUrl: randomBoolean(0.1) ? `https://cdn.lomashwood.co.uk/reviews/video-${i + 1}.mp4` : null,
        isApproved: randomBoolean(0.85),
        isPublished: randomBoolean(0.8),
        isFeatured: randomBoolean(0.2),
        category: randomItem(["KITCHEN", "BEDROOM", "BOTH"]),
        createdAt,
        updatedAt: createdAt,
      },
    });
  }

  const total = await prisma.review.count();
  console.log(`✓ Seeded ${total} reviews`);
}

async function main(): Promise<void> {
  console.log("Seeding content data...");

  await seedHomeSlider();
  await seedBlogs();
  await seedMediaWall();
  await seedFinanceContent();
  await seedReviews();

  console.log("\n✓ Content seeding complete");
}

main()
  .catch((error) => {
    console.error("Content seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });