import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🌱 Seeding content-service database...');

  const seoPages = [
    {
      pagePath: '/',
      title: 'Lomash Wood – Kitchen & Bedroom Design',
      description: 'Discover stunning kitchen and bedroom designs crafted to transform your home.',
      keywords: ['kitchen design', 'bedroom design', 'lomash wood', 'fitted kitchens', 'fitted bedrooms'],
      ogTitle: 'Lomash Wood – Kitchen & Bedroom Design',
      ogDescription: 'Discover stunning kitchen and bedroom designs crafted to transform your home.',
    },
    {
      pagePath: '/kitchens',
      title: 'Kitchen Designs – Lomash Wood',
      description: 'Browse our full range of beautiful, handcrafted kitchen designs and colour options.',
      keywords: ['kitchens', 'kitchen designs', 'fitted kitchens', 'modular kitchen', 'luxury kitchens'],
      ogTitle: 'Kitchen Designs – Lomash Wood',
      ogDescription: 'Browse our full range of beautiful, handcrafted kitchen designs.',
    },
    {
      pagePath: '/bedrooms',
      title: 'Bedroom Designs – Lomash Wood',
      description: 'Explore our elegant fitted bedroom furniture and wardrobe solutions.',
      keywords: ['bedrooms', 'fitted bedrooms', 'fitted wardrobes', 'bedroom furniture'],
      ogTitle: 'Bedroom Designs – Lomash Wood',
      ogDescription: 'Explore our elegant fitted bedroom furniture and wardrobe solutions.',
    },
    {
      pagePath: '/book-appointment',
      title: 'Book a Free Consultation – Lomash Wood',
      description: 'Book a free home measurement, online, or showroom consultation with our design experts.',
      keywords: ['book consultation', 'free kitchen design consultation', 'showroom appointment'],
    },
    {
      pagePath: '/find-a-showroom',
      title: 'Find a Showroom – Lomash Wood',
      description: 'Visit your nearest Lomash Wood showroom to see our full range of kitchens and bedrooms.',
      keywords: ['showroom', 'kitchen showroom', 'bedroom showroom', 'lomash wood showroom'],
    },
    {
      pagePath: '/sale',
      title: 'Kitchen & Bedroom Sale – Lomash Wood',
      description: 'Explore our latest kitchen and bedroom offers and package deals.',
      keywords: ['kitchen sale', 'bedroom sale', 'kitchen offers', 'bedroom deals'],
    },
    {
      pagePath: '/finance',
      title: 'Kitchen & Bedroom Finance – Lomash Wood',
      description: 'Spread the cost of your new kitchen or bedroom with our flexible finance options.',
      keywords: ['kitchen finance', 'bedroom finance', '0% finance', 'buy now pay later kitchens'],
    },
    {
      pagePath: '/blog',
      title: 'Inspiration & Design Blog – Lomash Wood',
      description: 'Get kitchen and bedroom design inspiration, tips, and guides from our experts.',
      keywords: ['kitchen blog', 'bedroom blog', 'interior design tips', 'home renovation ideas'],
    },
    {
      pagePath: '/about',
      title: 'About Us – Lomash Wood',
      description: 'Learn about Lomash Wood, our story, values, and commitment to quality design.',
      keywords: ['about lomash wood', 'kitchen company', 'bedroom company'],
    },
    {
      pagePath: '/contact',
      title: 'Contact Us – Lomash Wood',
      description: 'Get in touch with the Lomash Wood team for any queries or assistance.',
      keywords: ['contact lomash wood', 'kitchen company contact'],
    },
    {
      pagePath: '/our-process',
      title: 'Our Design Process – Lomash Wood',
      description: 'Discover our simple 4-step process from consultation to installation.',
      keywords: ['kitchen installation process', 'how it works', 'lomash wood process'],
    },
    {
      pagePath: '/why-choose-us',
      title: 'Why Choose Lomash Wood',
      description: 'Find out why thousands of homeowners choose Lomash Wood for their kitchen and bedroom.',
      keywords: ['why choose lomash wood', 'best kitchen company', 'kitchen design experts'],
    },
    {
      pagePath: '/brochure',
      title: 'Request a Free Brochure – Lomash Wood',
      description: 'Request your free Lomash Wood kitchen and bedroom brochure today.',
      keywords: ['kitchen brochure', 'bedroom brochure', 'free brochure'],
    },
    {
      pagePath: '/careers',
      title: 'Careers at Lomash Wood',
      description: 'Join the Lomash Wood team. Explore our latest job opportunities.',
      keywords: ['careers', 'jobs', 'lomash wood jobs', 'kitchen design careers'],
    },
    {
      pagePath: '/privacy-policy',
      title: 'Privacy Policy – Lomash Wood',
      description: 'Read our privacy policy to understand how we collect and use your data.',
      keywords: [],
      indexStatus: 'NOINDEX' as const,
    },
    {
      pagePath: '/terms-and-conditions',
      title: 'Terms & Conditions – Lomash Wood',
      description: 'Read our terms and conditions for using the Lomash Wood website and services.',
      keywords: [],
      indexStatus: 'NOINDEX' as const,
    },
  ];

  for (const seo of seoPages) {
    await prisma.seoMeta.upsert({
      where: { pagePath: seo.pagePath },
      update: {},
      create: {
        pagePath: seo.pagePath,
        title: seo.title,
        description: seo.description,
        keywords: seo.keywords,
        ogTitle: seo.ogTitle ?? seo.title,
        ogDescription: seo.ogDescription ?? seo.description,
        indexStatus: seo.indexStatus ?? 'INDEX',
      },
    });
  }
  console.log('✅ SEO meta seeded');

  // ─────────────────────────────────────────────
  // HOME SLIDERS
  // ─────────────────────────────────────────────
  const sliders = [
    {
      title: 'Transform Your Kitchen',
      description: 'Beautifully crafted kitchens designed around you. Book a free consultation today.',
      imageUrl: 'https://cdn.lomashwood.com/sliders/hero-kitchen-01.jpg',
      imageKey: 'sliders/hero-kitchen-01.jpg',
      buttonText: 'Explore Kitchens',
      buttonUrl: '/kitchens',
      target: 'HOME' as const,
      sortOrder: 1,
    },
    {
      title: 'Bedroom Dreams Realised',
      description: 'Elegant fitted bedroom furniture crafted to maximise every inch of your space.',
      imageUrl: 'https://cdn.lomashwood.com/sliders/hero-bedroom-01.jpg',
      imageKey: 'sliders/hero-bedroom-01.jpg',
      buttonText: 'Explore Bedrooms',
      buttonUrl: '/bedrooms',
      target: 'HOME' as const,
      sortOrder: 2,
    },
    {
      title: 'Exclusive Sale – Up to 50% Off',
      description: 'Our biggest sale of the year. Limited time offers on kitchens and bedrooms.',
      imageUrl: 'https://cdn.lomashwood.com/sliders/hero-sale-01.jpg',
      imageKey: 'sliders/hero-sale-01.jpg',
      buttonText: 'Shop the Sale',
      buttonUrl: '/sale',
      target: 'HOME' as const,
      sortOrder: 3,
    },
    {
      title: 'Flexible Finance Available',
      description: 'Spread the cost of your dream kitchen with 0% finance options.',
      imageUrl: 'https://cdn.lomashwood.com/sliders/hero-finance-01.jpg',
      imageKey: 'sliders/hero-finance-01.jpg',
      buttonText: 'Learn About Finance',
      buttonUrl: '/finance',
      target: 'HOME' as const,
      sortOrder: 4,
    },
  ];

  for (const slider of sliders) {
    await prisma.homeSlider.upsert({
      where: { id: `slider-seed-${slider.sortOrder}` },
      update: {},
      create: {
        id: `slider-seed-${slider.sortOrder}`,
        ...slider,
      },
    });
  }
  console.log('✅ Home sliders seeded');

  // ─────────────────────────────────────────────
  // PROCESS STEPS
  // ─────────────────────────────────────────────
  const processSteps = [
    {
      stepNumber: 1,
      type: 'CONSULTATION' as const,
      title: 'Free Consultation',
      description:
        'Book a free consultation at your home, online, or in one of our showrooms. Our designers will understand your needs, lifestyle, and budget to create the perfect design brief.',
      ctaText: 'Book a Consultation',
      ctaUrl: '/book-appointment',
    },
    {
      stepNumber: 2,
      type: 'DESIGN' as const,
      title: 'Design & Planning',
      description:
        'Our expert designers create a bespoke 3D design tailored to your space. We refine every detail together — from layouts and finishes to appliances and colour palettes.',
      ctaText: 'View Our Designs',
      ctaUrl: '/kitchens',
    },
    {
      stepNumber: 3,
      type: 'MANUFACTURING' as const,
      title: 'Precision Manufacturing',
      description:
        'Your kitchen or bedroom is crafted using the highest quality materials and precision manufacturing processes, ensuring every component meets our exacting standards.',
    },
    {
      stepNumber: 4,
      type: 'INSTALLATION' as const,
      title: 'Professional Installation',
      description:
        'Our skilled installation teams handle every aspect of fitting your new kitchen or bedroom, working efficiently and cleanly to minimise disruption to your home.',
    },
  ];

  for (const step of processSteps) {
    await prisma.processStep.upsert({
      where: { stepNumber: step.stepNumber },
      update: {},
      create: step,
    });
  }
  console.log('✅ Process steps seeded');

  // ─────────────────────────────────────────────
  // WHY CHOOSE US
  // ─────────────────────────────────────────────
  const whyItems = [
    {
      id: 'why-seed-1',
      title: 'Over 20 Years of Experience',
      description:
        'With two decades in the industry, Lomash Wood brings unrivalled expertise to every kitchen and bedroom project.',
      sortOrder: 1,
    },
    {
      id: 'why-seed-2',
      title: 'Bespoke Design Service',
      description:
        'Every design is created uniquely for you. No templates, no compromises — just a kitchen or bedroom that perfectly fits your life.',
      sortOrder: 2,
    },
    {
      id: 'why-seed-3',
      title: 'Premium Quality Materials',
      description:
        'We source only the finest materials and work with trusted suppliers to ensure lasting quality and beauty in every piece.',
      sortOrder: 3,
    },
    {
      id: 'why-seed-4',
      title: '10-Year Guarantee',
      description:
        'Our confidence in our craftsmanship means we offer a comprehensive 10-year guarantee on all fitted kitchens and bedrooms.',
      sortOrder: 4,
    },
    {
      id: 'why-seed-5',
      title: 'Flexible Finance',
      description:
        'We offer a range of finance options so your perfect kitchen or bedroom is achievable at a pace that suits your budget.',
      sortOrder: 5,
    },
    {
      id: 'why-seed-6',
      title: 'Aftercare Support',
      description:
        'Our relationship doesn't end at installation. Our dedicated aftercare team is on hand whenever you need us.',
      sortOrder: 6,
    },
  ];

  for (const item of whyItems) {
    await prisma.whyChooseUsItem.upsert({
      where: { id: item.id },
      update: {},
      create: item,
    });
  }
  console.log('✅ Why choose us items seeded');

  // ─────────────────────────────────────────────
  // FAQs
  // ─────────────────────────────────────────────
  const faqs = [
    {
      id: 'faq-seed-1',
      question: 'How long does it take to design and install a new kitchen?',
      answer:
        'The timeline varies depending on the complexity of the project. Typically, from initial consultation to installation completion takes 8–12 weeks. Our team will give you a precise schedule during the design stage.',
      category: 'GENERAL' as const,
      sortOrder: 1,
    },
    {
      id: 'faq-seed-2',
      question: 'Do you offer a free design consultation?',
      answer:
        'Yes, all initial consultations are completely free with no obligation. You can choose from a home visit, an online video call, or a visit to one of our showrooms. Our designers will create a full 3D design for you at no cost.',
      category: 'GENERAL' as const,
      sortOrder: 2,
    },
    {
      id: 'faq-seed-3',
      question: 'What finance options are available?',
      answer:
        'We offer flexible finance solutions including 0% interest-free credit for up to 12 months, and buy-now-pay-later options. Finance is subject to status. Visit our Finance page for full details and eligibility.',
      category: 'FINANCE' as const,
      sortOrder: 1,
    },
    {
      id: 'faq-seed-4',
      question: 'What types of appointments can I book?',
      answer:
        'We offer three types of appointments: a Home Measurement visit where our designer comes to you, an Online consultation via video call, or a Showroom visit where you can see our full range in person. All are free of charge.',
      category: 'APPOINTMENTS' as const,
      sortOrder: 1,
    },
    {
      id: 'faq-seed-5',
      question: 'How many colours and finishes are available?',
      answer:
        'We offer an extensive palette of over 50 colours and finishes across our kitchen and bedroom ranges. From classic shaker whites to bold gloss colours, handleless contemporary styles, and everything in between.',
      category: 'PRODUCTS' as const,
      sortOrder: 1,
    },
    {
      id: 'faq-seed-6',
      question: 'Do you handle the installation yourselves?',
      answer:
        'Yes, our installations are carried out by our own trained and vetted fitters, not subcontractors. They will handle everything from removing your existing kitchen to final snagging, ensuring a clean and tidy job throughout.',
      category: 'INSTALLATION' as const,
      sortOrder: 1,
    },
    {
      id: 'faq-seed-7',
      question: 'Is there a guarantee on fitted kitchens and bedrooms?',
      answer:
        'All our fitted kitchens and bedrooms come with a 10-year guarantee covering manufacturing defects and workmanship. We also work with appliance manufacturers to provide their own warranties on integrated appliances.',
      category: 'PRODUCTS' as const,
      sortOrder: 2,
    },
    {
      id: 'faq-seed-8',
      question: 'Can I return or exchange items if I change my mind?',
      answer:
        'As all our kitchens and bedrooms are bespoke and made to order, returns are generally not possible once manufacturing has begun. However, we encourage you to take full advantage of the design stage to ensure you are completely satisfied before sign-off.',
      category: 'RETURNS' as const,
      sortOrder: 1,
    },
  ];

  for (const faq of faqs) {
    await prisma.faq.upsert({
      where: { id: faq.id },
      update: {},
      create: faq,
    });
  }
  console.log('✅ FAQs seeded');

  // ─────────────────────────────────────────────
  // TESTIMONIALS
  // ─────────────────────────────────────────────
  const testimonials = [
    {
      id: 'testimonial-seed-1',
      customerName: 'Sarah & James Thompson',
      customerCity: 'London',
      rating: 5,
      title: 'Absolutely transformed our home',
      body: "We had our kitchen fitted by Lomash Wood and couldn't be happier. From the initial design consultation through to the final installation, the team was professional, considerate, and incredibly skilled. The kitchen looks stunning and has completely transformed how we use our home.",
      projectType: 'Kitchen',
      status: 'PUBLISHED' as const,
      isFeatured: true,
      publishedAt: new Date('2025-10-15'),
    },
    {
      id: 'testimonial-seed-2',
      customerName: 'Michael Okafor',
      customerCity: 'Manchester',
      rating: 5,
      title: 'Dream bedroom finally achieved',
      body: 'I had been putting off getting a fitted bedroom for years because of bad experiences elsewhere. Lomash Wood changed everything. The designer listened carefully to what I wanted and delivered beyond my expectations. The quality of the materials and the precision of the installation were exceptional.',
      projectType: 'Bedroom',
      status: 'PUBLISHED' as const,
      isFeatured: true,
      publishedAt: new Date('2025-11-20'),
    },
    {
      id: 'testimonial-seed-3',
      customerName: 'Priya Sharma',
      customerCity: 'Birmingham',
      rating: 5,
      title: 'Seamless process from start to finish',
      body: 'The whole process was seamless. The 3D design preview really helped me visualise the finished kitchen before anything was ordered. The fitters were polite, tidy, and finished ahead of schedule. Would absolutely recommend Lomash Wood to anyone.',
      projectType: 'Kitchen',
      status: 'PUBLISHED' as const,
      isFeatured: false,
      publishedAt: new Date('2025-12-05'),
    },
    {
      id: 'testimonial-seed-4',
      customerName: 'David & Claire Morgan',
      customerCity: 'Leeds',
      rating: 4,
      title: 'Great quality, very happy',
      body: 'Really pleased with our new fitted bedroom. The team was professional and the quality of the finish is excellent. Minor delay mid-project but it was handled well. Overall a great experience and we love the result.',
      projectType: 'Bedroom',
      status: 'PUBLISHED' as const,
      isFeatured: false,
      publishedAt: new Date('2026-01-10'),
    },
    {
      id: 'testimonial-seed-5',
      customerName: 'Emma and Tom Clarke',
      customerCity: 'Bristol',
      rating: 5,
      title: 'Worth every penny',
      body: "We used Lomash Wood's finance option and it made getting the kitchen of our dreams possible without the financial strain. The design team were incredibly helpful and patient with our many questions. The kitchen is truly worth every penny.",
      projectType: 'Kitchen',
      status: 'PUBLISHED' as const,
      isFeatured: true,
      publishedAt: new Date('2026-01-25'),
    },
  ];

  for (const testimonial of testimonials) {
    await prisma.testimonial.upsert({
      where: { id: testimonial.id },
      update: {},
      create: testimonial,
    });
  }
  console.log('✅ Testimonials seeded');

  // ─────────────────────────────────────────────
  // FINANCE CONTENT
  // ─────────────────────────────────────────────
  const finance = await prisma.financeContent.upsert({
    where: { id: 'finance-seed-1' },
    update: {},
    create: {
      id: 'finance-seed-1',
      title: 'Flexible Finance for Your Dream Kitchen or Bedroom',
      description:
        'Spread the cost of your new kitchen or bedroom with our market-leading finance options. We work with trusted lenders to bring you accessible, fair, and transparent financing.',
      content: `
        <h2>Interest-Free Credit</h2>
        <p>Take advantage of our 0% interest-free credit for up to 12 months. Pay for your kitchen or bedroom over time without paying a penny more than the original price.</p>
        <h2>Buy Now, Pay Later</h2>
        <p>Delay your first payment for up to 12 months, giving you time to settle in before payments begin. Subject to status and eligibility.</p>
        <h2>Extended Finance Terms</h2>
        <p>For larger projects, we offer extended finance terms of up to 10 years at competitive APR rates, allowing you to enjoy your new space immediately while managing affordable monthly payments.</p>
        <h2>How to Apply</h2>
        <p>Applying for finance is simple. During your consultation, our team will walk you through the options and help you find the plan that suits your budget best. Decisions are typically made within minutes.</p>
      `,
      ctaText: 'Book a Free Consultation',
      ctaUrl: '/book-appointment',
      status: 'PUBLISHED',
      metaTitle: 'Kitchen & Bedroom Finance – Lomash Wood',
      metaDescription: 'Flexible 0% finance and buy-now-pay-later options for your new kitchen or bedroom.',
      publishedAt: new Date('2025-09-01'),
      features: {
        create: [
          {
            title: '0% Interest-Free Credit',
            description: 'Pay nothing extra. Spread the cost over 12 months completely interest free.',
            sortOrder: 1,
          },
          {
            title: 'Buy Now, Pay Later',
            description: 'Delay your first payment for up to 12 months and enjoy your new kitchen first.',
            sortOrder: 2,
          },
          {
            title: 'Up to 10 Year Terms',
            description: 'Manageable monthly payments spread over up to 10 years at competitive rates.',
            sortOrder: 3,
          },
          {
            title: 'Quick Decision',
            description: 'Simple online application with most decisions made in minutes.',
            sortOrder: 4,
          },
        ],
      },
    },
  });
  console.log('✅ Finance content seeded');

  // ─────────────────────────────────────────────
  // BLOGS
  // ─────────────────────────────────────────────
  const blogs = [
    {
      id: 'blog-seed-1',
      title: '10 Kitchen Design Trends for 2026',
      slug: '10-kitchen-design-trends-2026',
      excerpt: 'From statement island units to handleless cabinetry, discover the top kitchen design trends shaping homes in 2026.',
      content: `<h2>1. Handleless Cabinetry</h2><p>The handleless kitchen continues its dominance in 2026, offering clean lines and a contemporary aesthetic that appeals to modern homeowners...</p>
<h2>2. Statement Island Units</h2><p>Kitchen islands are no longer just functional – they are the centrepiece of the modern kitchen, doubling as a dining and social space...</p>
<h2>3. Bold Colour Palettes</h2><p>While white and grey remain popular, 2026 sees a bold shift towards deep navy blues, forest greens, and warm terracotta tones...</p>`,
      category: 'KITCHEN' as const,
      tags: ['kitchen trends', '2026', 'design', 'interior design'],
      authorName: 'Lomash Wood Design Team',
      status: 'PUBLISHED' as const,
      isFeatured: true,
      readTimeMinutes: 7,
      metaTitle: '10 Kitchen Design Trends for 2026',
      metaDescription: 'Discover the top kitchen design trends shaping homes in 2026, from handleless cabinetry to bold colour palettes.',
      publishedAt: new Date('2026-01-10'),
    },
    {
      id: 'blog-seed-2',
      title: 'How to Maximise Storage in a Small Bedroom',
      slug: 'maximise-storage-small-bedroom',
      excerpt: 'Think a small bedroom can\'t have beautiful fitted storage? Think again. Our expert tips will transform your compact space.',
      content: `<h2>Fitted Wardrobes to the Ceiling</h2><p>Using the full wall height with floor-to-ceiling fitted wardrobes dramatically increases storage capacity while creating an illusion of a taller room...</p>
<h2>Under-Bed Storage Solutions</h2><p>Ottoman-style beds with hydraulic lifts provide a generous hidden storage area for seasonal items, bedding, and more...</p>`,
      category: 'BEDROOM' as const,
      tags: ['bedroom storage', 'small bedroom', 'fitted wardrobes', 'organisation'],
      authorName: 'Lomash Wood Design Team',
      status: 'PUBLISHED' as const,
      isFeatured: true,
      readTimeMinutes: 5,
      metaTitle: 'Maximise Storage in a Small Bedroom – Lomash Wood',
      metaDescription: 'Expert tips to maximise storage in a small bedroom with fitted furniture and smart design solutions.',
      publishedAt: new Date('2026-01-20'),
    },
    {
      id: 'blog-seed-3',
      title: 'Choosing the Right Kitchen Worktop',
      slug: 'choosing-the-right-kitchen-worktop',
      excerpt: 'Quartz, granite, laminate, or solid wood? We break down the pros and cons of every popular worktop material so you can choose with confidence.',
      content: `<h2>Quartz Worktops</h2><p>Engineered quartz is currently the most popular worktop choice in the UK. It is non-porous, scratch-resistant, and available in an enormous range of colours and finishes...</p>
<h2>Granite Worktops</h2><p>Natural granite offers unique patterns and is highly durable. Each slab is one-of-a-kind. It requires periodic sealing to maintain its resistance to staining...</p>`,
      category: 'KITCHEN' as const,
      tags: ['worktops', 'quartz', 'granite', 'kitchen materials'],
      authorName: 'Lomash Wood Design Team',
      status: 'PUBLISHED' as const,
      isFeatured: false,
      readTimeMinutes: 6,
      metaTitle: 'Choosing the Right Kitchen Worktop – Lomash Wood',
      metaDescription: 'Quartz, granite, laminate, or wood? Our comprehensive guide to choosing the perfect kitchen worktop.',
      publishedAt: new Date('2026-02-01'),
    },
    {
      id: 'blog-seed-4',
      title: '5 Bedroom Lighting Ideas to Transform Your Space',
      slug: '5-bedroom-lighting-ideas',
      excerpt: 'Great bedroom design is as much about lighting as it is about furniture. Explore our five favourite lighting schemes that will completely transform your bedroom.',
      content: `<h2>Layered Lighting</h2><p>The key to a beautifully lit bedroom is layering. Combine ambient ceiling lighting, task lighting for reading, and accent lighting within wardrobes and behind headboards...</p>`,
      category: 'BEDROOM' as const,
      tags: ['bedroom lighting', 'interior design', 'bedroom tips'],
      authorName: 'Lomash Wood Design Team',
      status: 'PUBLISHED' as const,
      isFeatured: false,
      readTimeMinutes: 4,
      metaTitle: '5 Bedroom Lighting Ideas – Lomash Wood',
      metaDescription: 'Transform your bedroom with these five lighting ideas from the Lomash Wood design team.',
      publishedAt: new Date('2026-02-10'),
    },
    {
      id: 'blog-seed-5',
      title: 'The Complete Guide to Kitchen Layouts',
      slug: 'complete-guide-kitchen-layouts',
      excerpt: 'L-shaped, U-shaped, galley, or open-plan island? Choosing the right kitchen layout is the most important decision in any kitchen design project.',
      content: `<h2>The Work Triangle</h2><p>The classic kitchen design principle of the work triangle positions the sink, hob, and fridge in a triangle formation to minimise unnecessary movement during cooking...</p>
<h2>L-Shaped Kitchens</h2><p>The L-shaped layout is the most versatile and suits a wide range of room sizes. It creates a natural workflow and leaves space for a table or island...</p>`,
      category: 'DESIGN' as const,
      tags: ['kitchen layout', 'kitchen design guide', 'l-shape kitchen', 'u-shape kitchen'],
      authorName: 'Lomash Wood Design Team',
      status: 'PUBLISHED' as const,
      isFeatured: true,
      readTimeMinutes: 8,
      metaTitle: 'The Complete Guide to Kitchen Layouts – Lomash Wood',
      metaDescription: 'Everything you need to know about choosing the perfect kitchen layout for your home.',
      publishedAt: new Date('2026-02-14'),
    },
  ];

  for (const blog of blogs) {
    await prisma.blog.upsert({
      where: { slug: blog.slug },
      update: {},
      create: blog,
    });
  }
  console.log('✅ Blogs seeded');

  // ─────────────────────────────────────────────
  // CMS PAGES
  // ─────────────────────────────────────────────
  const cmsPages = [
    {
      id: 'page-seed-about',
      title: 'About Us',
      slug: 'about',
      description: 'Learn more about Lomash Wood and our passion for beautiful design.',
      type: 'STATIC' as const,
      status: 'PUBLISHED' as const,
      isIndexable: true,
      metaTitle: 'About Lomash Wood',
      metaDescription: 'Discover the story behind Lomash Wood and our commitment to exceptional kitchen and bedroom design.',
      publishedAt: new Date('2025-09-01'),
      blocks: [
        {
          id: 'block-about-1',
          type: 'hero',
          order: 1,
          data: {
            heading: 'Our Story',
            subheading: 'Crafting beautiful kitchens and bedrooms for over 20 years',
            imageUrl: 'https://cdn.lomashwood.com/pages/about-hero.jpg',
          },
        },
        {
          id: 'block-about-2',
          type: 'text-content',
          order: 2,
          data: {
            body: '<p>Lomash Wood was founded with a single vision: to bring exceptional design and craftsmanship within reach of every homeowner...</p>',
          },
        },
      ],
    },
    {
      id: 'page-seed-contact',
      title: 'Contact Us',
      slug: 'contact',
      description: 'Get in touch with the Lomash Wood team.',
      type: 'STATIC' as const,
      status: 'PUBLISHED' as const,
      isIndexable: true,
      metaTitle: 'Contact Lomash Wood',
      metaDescription: 'Contact the Lomash Wood team for enquiries about kitchens, bedrooms, or appointments.',
      publishedAt: new Date('2025-09-01'),
      blocks: [
        {
          id: 'block-contact-1',
          type: 'contact-form',
          order: 1,
          data: {
            heading: 'Get in Touch',
            subheading: 'Fill in the form below and we will get back to you within 24 hours.',
          },
        },
      ],
    },
    {
      id: 'page-seed-privacy',
      title: 'Privacy Policy',
      slug: 'privacy-policy',
      description: 'Lomash Wood privacy policy.',
      type: 'STATIC' as const,
      status: 'PUBLISHED' as const,
      isIndexable: false,
      metaTitle: 'Privacy Policy – Lomash Wood',
      publishedAt: new Date('2025-09-01'),
      blocks: [],
    },
    {
      id: 'page-seed-terms',
      title: 'Terms & Conditions',
      slug: 'terms-and-conditions',
      description: 'Lomash Wood terms and conditions.',
      type: 'STATIC' as const,
      status: 'PUBLISHED' as const,
      isIndexable: false,
      metaTitle: 'Terms & Conditions – Lomash Wood',
      publishedAt: new Date('2025-09-01'),
      blocks: [],
    },
    {
      id: 'page-seed-cookies',
      title: 'Cookies Policy',
      slug: 'cookies',
      description: 'Lomash Wood cookies policy.',
      type: 'STATIC' as const,
      status: 'PUBLISHED' as const,
      isIndexable: false,
      metaTitle: 'Cookies Policy – Lomash Wood',
      publishedAt: new Date('2025-09-01'),
      blocks: [],
    },
    {
      id: 'page-seed-our-process',
      title: 'Our Process',
      slug: 'our-process',
      description: 'Our simple 4-step process from consultation to installation.',
      type: 'DYNAMIC' as const,
      status: 'PUBLISHED' as const,
      isIndexable: true,
      metaTitle: 'Our Design Process – Lomash Wood',
      metaDescription: 'Our simple 4-step process — from free consultation to professional installation.',
      publishedAt: new Date('2025-09-01'),
      blocks: [],
    },
    {
      id: 'page-seed-why-us',
      title: 'Why Choose Us',
      slug: 'why-choose-us',
      description: 'Discover why homeowners choose Lomash Wood.',
      type: 'DYNAMIC' as const,
      status: 'PUBLISHED' as const,
      isIndexable: true,
      metaTitle: 'Why Choose Lomash Wood',
      metaDescription: 'Find out why thousands of homeowners trust Lomash Wood for their kitchen and bedroom.',
      publishedAt: new Date('2025-09-01'),
      blocks: [],
    },
  ];

  for (const page of cmsPages) {
    await prisma.cmsPage.upsert({
      where: { slug: page.slug },
      update: {},
      create: {
        id: page.id,
        title: page.title,
        slug: page.slug,
        description: page.description,
        type: page.type,
        status: page.status,
        isIndexable: page.isIndexable,
        metaTitle: page.metaTitle,
        metaDescription: page.metaDescription ?? null,
        publishedAt: page.publishedAt,
        blocks: page.blocks,
      },
    });
  }
  console.log('✅ CMS pages seeded');

  // ─────────────────────────────────────────────
  // CAREERS
  // ─────────────────────────────────────────────
  const careers = [
    {
      id: 'career-seed-1',
      title: 'Kitchen & Bedroom Designer',
      slug: 'kitchen-bedroom-designer',
      department: 'DESIGN' as const,
      type: 'FULL_TIME' as const,
      location: 'London, UK',
      isRemote: false,
      description:
        '<p>We are looking for a passionate and creative Kitchen & Bedroom Designer to join our growing design team. You will work directly with customers to translate their vision into stunning, functional spaces.</p>',
      requirements:
        '<ul><li>Minimum 2 years experience in kitchen or bedroom design</li><li>Proficiency in 2020 Design or similar CAD software</li><li>Strong communication and presentation skills</li><li>A portfolio demonstrating your design ability</li></ul>',
      benefits:
        '<ul><li>Competitive salary DOE</li><li>28 days holiday plus bank holidays</li><li>Company pension scheme</li><li>Staff discounts on kitchens and bedrooms</li><li>Ongoing training and development</li></ul>',
      salaryMin: 28000,
      salaryMax: 38000,
      salaryCurrency: 'GBP',
      status: 'PUBLISHED' as const,
      publishedAt: new Date('2026-01-15'),
      closingAt: new Date('2026-03-31'),
    },
    {
      id: 'career-seed-2',
      title: 'Senior Sales Consultant',
      slug: 'senior-sales-consultant',
      department: 'SALES' as const,
      type: 'FULL_TIME' as const,
      location: 'Manchester, UK',
      isRemote: false,
      description:
        '<p>An exciting opportunity has arisen for a driven and experienced Senior Sales Consultant to join our Manchester showroom team. You will be responsible for converting showroom visits and inbound leads into signed kitchen and bedroom projects.</p>',
      requirements:
        '<ul><li>Proven track record in high-value retail sales</li><li>Experience in kitchens, bedrooms, or luxury home furnishings preferred</li><li>Excellent interpersonal and negotiation skills</li><li>Target-driven with a consultative selling approach</li></ul>',
      benefits:
        '<ul><li>Base salary plus uncapped commission</li><li>OTE £50,000–£70,000</li><li>Company car allowance</li><li>28 days holiday</li></ul>',
      salaryMin: 30000,
      salaryMax: 40000,
      salaryCurrency: 'GBP',
      status: 'PUBLISHED' as const,
      publishedAt: new Date('2026-01-20'),
      closingAt: new Date('2026-04-15'),
    },
    {
      id: 'career-seed-3',
      title: 'Digital Marketing Executive',
      slug: 'digital-marketing-executive',
      department: 'MARKETING' as const,
      type: 'FULL_TIME' as const,
      location: 'Remote (UK based)',
      isRemote: true,
      description:
        '<p>We are seeking a talented Digital Marketing Executive to support the growth of our online presence and lead generation efforts across SEO, PPC, social media, and email campaigns.</p>',
      requirements:
        '<ul><li>2+ years digital marketing experience</li><li>Experience with Google Analytics, Meta Ads, and Google Ads</li><li>Strong copywriting and content creation skills</li><li>Understanding of SEO best practices</li></ul>',
      benefits:
        '<ul><li>Fully remote role</li><li>£28,000–£35,000 DOE</li><li>Home office allowance</li><li>Flexible hours</li></ul>',
      salaryMin: 28000,
      salaryMax: 35000,
      salaryCurrency: 'GBP',
      status: 'PUBLISHED' as const,
      publishedAt: new Date('2026-02-01'),
      closingAt: new Date('2026-04-30'),
    },
  ];

  for (const career of careers) {
    await prisma.career.upsert({
      where: { slug: career.slug },
      update: {},
      create: career,
    });
  }
  console.log('✅ Careers seeded');

  // ─────────────────────────────────────────────
  // ACCREDITATIONS
  // ─────────────────────────────────────────────
  const accreditations = [
    {
      id: 'accred-seed-1',
      name: 'KBSA Member',
      type: 'MEMBERSHIP' as const,
      description: 'Kitchen Bathroom Bedroom Specialists Association member',
      imageUrl: 'https://cdn.lomashwood.com/accreditations/kbsa.svg',
      imageKey: 'accreditations/kbsa.svg',
      altText: 'KBSA Member',
      linkUrl: 'https://www.kbsa.org.uk',
      sortOrder: 1,
    },
    {
      id: 'accred-seed-2',
      name: 'Which? Trusted Trader',
      type: 'CERTIFICATION' as const,
      description: 'Verified and trusted by Which? consumer organisation',
      imageUrl: 'https://cdn.lomashwood.com/accreditations/which-trusted-trader.svg',
      imageKey: 'accreditations/which-trusted-trader.svg',
      altText: 'Which? Trusted Trader',
      linkUrl: 'https://trustedtraders.which.co.uk',
      sortOrder: 2,
    },
    {
      id: 'accred-seed-3',
      name: 'Houzz Best of 2025',
      type: 'AWARD' as const,
      description: 'Winner of the Houzz Best Kitchen Designer award 2025',
      imageUrl: 'https://cdn.lomashwood.com/accreditations/houzz-best-2025.svg',
      imageKey: 'accreditations/houzz-best-2025.svg',
      altText: 'Houzz Best of 2025',
      linkUrl: 'https://www.houzz.co.uk',
      issuedAt: new Date('2025-01-01'),
      sortOrder: 3,
    },
    {
      id: 'accred-seed-4',
      name: 'ISO 9001 Certified',
      type: 'CERTIFICATION' as const,
      description: 'ISO 9001:2015 quality management certification',
      imageUrl: 'https://cdn.lomashwood.com/accreditations/iso9001.svg',
      imageKey: 'accreditations/iso9001.svg',
      altText: 'ISO 9001 Certified',
      sortOrder: 4,
    },
  ];

  for (const accreditation of accreditations) {
    await prisma.accreditation.upsert({
      where: { id: accreditation.id },
      update: {},
      create: accreditation,
    });
  }
  console.log('✅ Accreditations seeded');

  // ─────────────────────────────────────────────
  // LOGOS (partner brands)
  // ─────────────────────────────────────────────
  const logos = [
    { id: 'logo-seed-1', name: 'Neff', imageUrl: 'https://cdn.lomashwood.com/logos/neff.svg', imageKey: 'logos/neff.svg', altText: 'Neff Appliances', sortOrder: 1 },
    { id: 'logo-seed-2', name: 'Siemens', imageUrl: 'https://cdn.lomashwood.com/logos/siemens.svg', imageKey: 'logos/siemens.svg', altText: 'Siemens Appliances', sortOrder: 2 },
    { id: 'logo-seed-3', name: 'Bosch', imageUrl: 'https://cdn.lomashwood.com/logos/bosch.svg', imageKey: 'logos/bosch.svg', altText: 'Bosch Appliances', sortOrder: 3 },
    { id: 'logo-seed-4', name: 'Blanco', imageUrl: 'https://cdn.lomashwood.com/logos/blanco.svg', imageKey: 'logos/blanco.svg', altText: 'Blanco Sinks', sortOrder: 4 },
    { id: 'logo-seed-5', name: 'Quooker', imageUrl: 'https://cdn.lomashwood.com/logos/quooker.svg', imageKey: 'logos/quooker.svg', altText: 'Quooker Taps', sortOrder: 5 },
    { id: 'logo-seed-6', name: 'Häfele', imageUrl: 'https://cdn.lomashwood.com/logos/hafele.svg', imageKey: 'logos/hafele.svg', altText: 'Häfele Hardware', sortOrder: 6 },
  ];

  for (const logo of logos) {
    await prisma.logo.upsert({
      where: { id: logo.id },
      update: {},
      create: logo,
    });
  }
  console.log('✅ Logos seeded');

  // ─────────────────────────────────────────────
  // MENUS
  // ─────────────────────────────────────────────
  const navMenu = await prisma.menu.upsert({
    where: { name: 'main-navigation' },
    update: {},
    create: {
      name: 'main-navigation',
      location: 'header',
      items: {
        create: [
          { label: 'Bedroom', url: '/bedrooms', sortOrder: 1 },
          { label: 'Kitchen', url: '/kitchens', sortOrder: 2 },
          { label: 'Offer a Free Consultation', url: '/book-appointment', sortOrder: 3 },
          { label: 'Find a Showroom', url: '/find-a-showroom', sortOrder: 4 },
          { label: 'My Account', url: '/account', sortOrder: 5 },
          { label: 'Finance', url: '/finance', sortOrder: 6 },
        ],
      },
    },
  });

  await prisma.menu.upsert({
    where: { name: 'hamburger-menu' },
    update: {},
    create: {
      name: 'hamburger-menu',
      location: 'header-hamburger',
      items: {
        create: [
          { label: 'Inspiration', url: '/blog', sortOrder: 1 },
          { label: 'Our Blog', url: '/blog', sortOrder: 2 },
          { label: 'Download Brochure', url: '/brochure', sortOrder: 3 },
        ],
      },
    },
  });

  await prisma.menu.upsert({
    where: { name: 'footer-menu' },
    update: {},
    create: {
      name: 'footer-menu',
      location: 'footer',
      items: {
        create: [
          { label: 'About Us', url: '/about', sortOrder: 1 },
          { label: 'Contact Us', url: '/contact', sortOrder: 2 },
          { label: 'Careers', url: '/careers', sortOrder: 3 },
          { label: 'Privacy Policy', url: '/privacy-policy', sortOrder: 4 },
          { label: 'Terms & Conditions', url: '/terms-and-conditions', sortOrder: 5 },
          { label: 'Cookies', url: '/cookies', sortOrder: 6 },
          { label: 'Sitemap', url: '/sitemap.xml', sortOrder: 7 },
        ],
      },
    },
  });
  console.log('✅ Menus seeded');

  // ─────────────────────────────────────────────
  // MEDIA WALL CONTENT
  // ─────────────────────────────────────────────
  await prisma.mediaWallContent.upsert({
    where: { id: 'media-wall-seed-1' },
    update: {},
    create: {
      id: 'media-wall-seed-1',
      title: 'Our Work',
      description:
        'A showcase of our latest kitchen and bedroom installation projects. Every space is unique — and every project is one we are proud of.',
      backgroundImageUrl: 'https://cdn.lomashwood.com/media-wall/background.jpg',
      backgroundImageKey: 'media-wall/background.jpg',
      layout: 'GRID_3',
      ctaText: 'Book a Free Consultation',
      ctaUrl: '/book-appointment',
      status: 'PUBLISHED',
      publishedAt: new Date('2025-09-01'),
    },
  });
  console.log('✅ Media wall content seeded');

  // ─────────────────────────────────────────────
  // SITE SETTINGS
  // ─────────────────────────────────────────────
  const siteSettings = [
    { key: 'site.name', value: 'Lomash Wood', description: 'The name of the site', isPublic: true },
    { key: 'site.tagline', value: 'Kitchen & Bedroom Design Experts', description: 'Site tagline', isPublic: true },
    { key: 'site.email', value: 'hello@lomashwood.com', description: 'Primary contact email', isPublic: true },
    { key: 'site.phone', value: '0800 123 4567', description: 'Primary contact phone', isPublic: true },
    { key: 'site.address', value: '1 Design Quarter, London, EC1A 1BB', description: 'Primary address', isPublic: true },
    { key: 'site.socialInstagram', value: 'https://instagram.com/lomashwood', description: 'Instagram URL', isPublic: true },
    { key: 'site.socialFacebook', value: 'https://facebook.com/lomashwood', description: 'Facebook URL', isPublic: true },
    { key: 'site.socialHouzz', value: 'https://houzz.co.uk/lomashwood', description: 'Houzz profile URL', isPublic: true },
    { key: 'site.googleTagManagerId', value: 'GTM-XXXXXXX', description: 'Google Tag Manager container ID', isPublic: false },
    { key: 'site.googleSearchConsoleVerification', value: '', description: 'Google Search Console meta verification', isPublic: false },
    { key: 'brochure.title', value: 'Lomash Wood 2026 Collection', description: 'Current brochure title for the brochure form', isPublic: true },
    { key: 'brochure.imageUrl', value: 'https://cdn.lomashwood.com/brochure/cover-2026.jpg', description: 'Brochure cover image URL', isPublic: true },
    { key: 'appointments.bookingUrl', value: 'https://booking.lomashwood.com', description: 'External booking system URL', isPublic: false },
    { key: 'appointments.timezoneDefault', value: 'Europe/London', description: 'Default timezone for appointments', isPublic: false },
    { key: 'finance.representativeAPR', value: '9.9', description: 'Representative APR for finance (display only)', isPublic: true },
    { key: 'finance.maxTermMonths', value: '120', description: 'Maximum finance term in months', isPublic: true },
  ];

  for (const setting of siteSettings) {
    await prisma.siteSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: {
        key: setting.key,
        value: setting.value,
        description: setting.description,
        isPublic: setting.isPublic,
      },
    });
  }
  console.log('✅ Site settings seeded');

  // ─────────────────────────────────────────────
  // LANDING PAGES
  // ─────────────────────────────────────────────
  await prisma.landingPage.upsert({
    where: { slug: 'kitchen-sale-2026' },
    update: {},
    create: {
      title: 'Kitchen Sale 2026',
      slug: 'kitchen-sale-2026',
      headline: 'Our Biggest Kitchen Sale — Up to 50% Off',
      subheadline: 'Limited time only. Incredible savings on our full range of fitted kitchens. Book your free consultation today.',
      status: 'PUBLISHED',
      metaTitle: 'Kitchen Sale 2026 – Up to 50% Off',
      metaDescription: 'Our biggest kitchen sale. Up to 50% off fitted kitchens. Limited time only. Book a free consultation.',
      publishedAt: new Date('2026-01-01'),
      sections: [
        {
          id: 'section-sale-hero',
          type: 'hero-cta',
          order: 1,
          heading: 'Up to 50% Off All Kitchens',
          subheading: 'For a limited time only',
          ctaText: 'Book a Free Consultation',
          ctaUrl: '/book-appointment',
          backgroundImageUrl: 'https://cdn.lomashwood.com/landing/kitchen-sale-hero.jpg',
          data: {},
        },
        {
          id: 'section-sale-offers',
          type: 'offer-grid',
          order: 2,
          heading: 'Featured Offers',
          data: { productCategory: 'KITCHEN' },
        },
      ],
    },
  });

  await prisma.landingPage.upsert({
    where: { slug: 'bedroom-package-deals' },
    update: {},
    create: {
      title: 'Bedroom Package Deals',
      slug: 'bedroom-package-deals',
      headline: 'Complete Bedroom Packages — Everything Included',
      subheadline: 'Choose from our hand-picked bedroom packages that include fitting, full design service, and a 10-year guarantee.',
      status: 'PUBLISHED',
      metaTitle: 'Bedroom Package Deals – Lomash Wood',
      metaDescription: 'Complete fitted bedroom packages including design, manufacturing, and installation. Book a free consultation.',
      publishedAt: new Date('2026-01-01'),
      sections: [
        {
          id: 'section-bedroom-hero',
          type: 'hero-cta',
          order: 1,
          heading: 'Everything Included — From £3,999',
          subheading: 'Complete bedroom packages with no hidden costs',
          ctaText: 'View Packages',
          ctaUrl: '/bedrooms',
          backgroundImageUrl: 'https://cdn.lomashwood.com/landing/bedroom-packages-hero.jpg',
          data: {},
        },
      ],
    },
  });
  console.log('✅ Landing pages seeded');

  console.log('✅ Content-service database seed complete.');
  console.log(`   → ${seoPages.length} SEO meta entries`);
  console.log(`   → ${sliders.length} home sliders`);
  console.log(`   → ${processSteps.length} process steps`);
  console.log(`   → ${whyItems.length} why-choose-us items`);
  console.log(`   → ${faqs.length} FAQs`);
  console.log(`   → ${testimonials.length} testimonials`);
  console.log(`   → 1 finance content block`);
  console.log(`   → ${blogs.length} blog posts`);
  console.log(`   → ${cmsPages.length} CMS pages`);
  console.log(`   → ${careers.length} career listings`);
  console.log(`   → ${accreditations.length} accreditations`);
  console.log(`   → ${logos.length} logos`);
  console.log('   → 3 menus (main nav, hamburger, footer)');
  console.log('   → 1 media wall content block');
  console.log(`   → ${siteSettings.length} site settings`);
  console.log('   → 2 landing pages');
}

main()
  .catch((e: unknown) => {
    console.error('Seed failed:', e);
    process.exit(1);
  })
  .finally((): void => {
    void prisma.$disconnect();
  });
