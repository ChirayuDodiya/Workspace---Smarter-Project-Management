import slugify from 'slugify';
import prisma from '../prisma/client.js';

const toSlug = (name) => {
  const slug = slugify(name || '', { lower: true, strict: true, trim: true });
  return slug.length > 240 ? slug.slice(0, 240) : slug;
};

const buildSlug = async (name, excludeProjectId = null) => {
  const baseSlug = toSlug(name) || `project-${Date.now()}`;
  
  const where = {
    slug: {
      startsWith: baseSlug,
    },
    deleted_at: null,
  };

  if (excludeProjectId) {
    where.NOT = { id: excludeProjectId };
  }

  const existingSlugs = await prisma.projects.findMany({
    where,
    select: { slug: true },
  });

  const usedSlugs = new Set(existingSlugs.map((item) => item.slug));
  if (!usedSlugs.has(baseSlug)) {
    return baseSlug;
  }

  let counter = 1;
  let candidate = `${baseSlug}-${counter}`;
  while (usedSlugs.has(candidate)) {
    counter += 1;
    candidate = `${baseSlug}-${counter}`;
  }

  return candidate;
};

export { buildSlug };
