import { Router } from 'express';
// import { blogRouter } from '../../app/blogs/blog.routes';

// import { mediaWallRouter } from '../../app/media-wall/media.routes';

// import { cmsPageRouter } from '../../app/cms/page.routes';
// import { seoRouter } from '../../app/seo/seo.routes';

// import { landingPageRouter } from '../../app/landing-pages/landing.routes';
// import { healthRouter } from '../../infrastructure/http/health.routes';
import bannerRoutes from '../../routes/banner.routes';
import blogRoutes from '../../routes/blog.routes';

export function createRouter(): Router {
  const router = Router();

  
  // router.use('/health', healthRouter);

  // router.use('/blogs', blogRouter);

  // router.use('/media', mediaWallRouter);

  // router.use('/pages', cmsPageRouter);

  // router.use('/seo', seoRouter);

  // router.use('/landing', landingPageRouter);

  router.use(bannerRoutes);
  router.use(blogRoutes);

  return router;
}