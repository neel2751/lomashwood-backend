import {
  CategoryResponseDTO,
  CategoryWithRelations,
  PaginatedCategoriesResponseDTO,
  PaginationMetaDTO,
  CategoryHierarchy,
  CategoryExportDTO,
  CategoryParent,
  CategoryChild,
  CategoryType,
  CategoryBreadcrumb,
  CategoryTreeNode,
  CategorySEOData,
} from './category.types';

export class CategoryMapper {
  static toResponseDTO(category: CategoryWithRelations): CategoryResponseDTO {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      type: category.type as CategoryType,
      image: category.image,
      icon: category.icon,
      parentId: category.parentId,
      order: category.order,
      isActive: category.isActive,
      isFeatured: category.isFeatured,
      metaTitle: category.metaTitle,
      metaDescription: category.metaDescription,
      metaKeywords: category.metaKeywords,
      parent: category.parent ? this.mapParent(category.parent) : null,
      children: category.children ? this.mapChildren(category.children) : undefined,
      productCount: category._count?.products,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  static toResponseDTOList(categories: CategoryWithRelations[]): CategoryResponseDTO[] {
    return categories.map((category) => this.toResponseDTO(category));
  }

  static toPaginatedResponse(
    categories: CategoryWithRelations[],
    total: number,
    page: number,
    limit: number
  ): PaginatedCategoriesResponseDTO {
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPreviousPage = page > 1;

    const meta: PaginationMetaDTO = {
      total,
      page,
      limit,
      totalPages,
      hasNextPage,
      hasPreviousPage,
    };

    return {
      data: this.toResponseDTOList(categories),
      meta,
    };
  }

  static mapParent(parent: { id: string; name: string; slug: string }): CategoryParent {
    return {
      id: parent.id,
      name: parent.name,
      slug: parent.slug,
    };
  }

  static mapChildren(
    children: Array<{ id: string; name: string; slug: string; order: number }>
  ): CategoryChild[] {
    return children.map((child) => ({
      id: child.id,
      name: child.name,
      slug: child.slug,
      order: child.order,
    }));
  }

  static toHierarchy(category: CategoryWithRelations): CategoryHierarchy {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      type: category.type as CategoryType,
      image: category.image,
      icon: category.icon,
      order: category.order,
      productCount: category._count?.products || 0,
      children: category.children
        ? category.children.map((child) => this.toHierarchy(child as CategoryWithRelations))
        : undefined,
    };
  }

  static toHierarchyList(categories: CategoryWithRelations[]): CategoryHierarchy[] {
    return categories.map((category) => this.toHierarchy(category));
  }

  static toExportDTO(category: CategoryWithRelations): CategoryExportDTO {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      type: category.type,
      image: category.image,
      icon: category.icon,
      parentId: category.parentId,
      parentName: category.parent?.name || null,
      order: category.order,
      isActive: category.isActive,
      isFeatured: category.isFeatured,
      productCount: category._count?.products || 0,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }

  static toExportDTOList(categories: CategoryWithRelations[]): CategoryExportDTO[] {
    return categories.map((category) => this.toExportDTO(category));
  }

  static toSimplifiedDTO(category: CategoryWithRelations) {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      type: category.type,
      image: category.image,
      icon: category.icon,
      order: category.order,
      isActive: category.isActive,
      productCount: category._count?.products || 0,
    };
  }

  static toSimplifiedDTOList(categories: CategoryWithRelations[]) {
    return categories.map((category) => this.toSimplifiedDTO(category));
  }

  static toTreeNode(category: CategoryWithRelations, depth: number = 0): CategoryTreeNode {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      type: category.type as CategoryType,
      image: category.image,
      icon: category.icon,
      order: category.order,
      isActive: category.isActive,
      isFeatured: category.isFeatured,
      productCount: category._count?.products || 0,
      depth,
      children: category.children
        ? category.children.map((child) =>
            this.toTreeNode(child as CategoryWithRelations, depth + 1)
          )
        : [],
    };
  }

  static toTreeNodeList(categories: CategoryWithRelations[]): CategoryTreeNode[] {
    return categories.map((category) => this.toTreeNode(category));
  }

  static toBreadcrumb(category: CategoryWithRelations, baseUrl: string = ''): CategoryBreadcrumb {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      url: `${baseUrl}/categories/${category.slug}`,
    };
  }

  static toBreadcrumbList(
    categories: CategoryWithRelations[],
    baseUrl: string = ''
  ): CategoryBreadcrumb[] {
    return categories.map((category) => this.toBreadcrumb(category, baseUrl));
  }

  static toSEOData(category: CategoryWithRelations, baseUrl: string = ''): CategorySEOData {
    return {
      title: category.metaTitle || `${category.name} | Lomash Wood`,
      description:
        category.metaDescription ||
        category.description ||
        `Browse our ${category.name} collection at Lomash Wood`,
      keywords:
        category.metaKeywords ||
        `${category.name}, ${category.type.toLowerCase()}, lomash wood`,
      canonical: `${baseUrl}/categories/${category.slug}`,
      image: category.image,
    };
  }

  static toMetadataDTO(category: CategoryWithRelations) {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      type: category.type,
      isActive: category.isActive,
      isFeatured: category.isFeatured,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }

  static groupByType(categories: CategoryWithRelations[]): Record<string, CategoryResponseDTO[]> {
    const grouped: Record<string, CategoryResponseDTO[]> = {
      KITCHEN: [],
      BEDROOM: [],
    };

    categories.forEach((category) => {
      const dto = this.toResponseDTO(category);
      if (grouped[category.type]) {
        grouped[category.type].push(dto);
      }
    });

    return grouped;
  }

  static extractUniqueSlugs(categories: CategoryWithRelations[]): string[] {
    return [...new Set(categories.map((c) => c.slug))].sort();
  }

  static buildCategoryPath(categories: CategoryWithRelations[]): string {
    return categories.map((c) => c.name).join(' > ');
  }

  static toCardDTO(category: CategoryWithRelations) {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      type: category.type,
      image: category.image,
      icon: category.icon,
      productCount: category._count?.products || 0,
      isActive: category.isActive,
    };
  }

  static toCardDTOList(categories: CategoryWithRelations[]) {
    return categories.map((category) => this.toCardDTO(category));
  }

  static toSelectOption(category: CategoryWithRelations) {
    return {
      value: category.id,
      label: category.name,
      slug: category.slug,
      type: category.type,
    };
  }

  static toSelectOptionList(categories: CategoryWithRelations[]) {
    return categories.map((category) => this.toSelectOption(category));
  }

  static toMenuItemDTO(category: CategoryWithRelations, depth: number = 0) {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      url: `/categories/${category.slug}`,
      icon: category.icon,
      depth,
      children: category.children
        ? category.children.map((child) =>
            this.toMenuItemDTO(child as CategoryWithRelations, depth + 1)
          )
        : [],
    };
  }

  static toMenuItemList(categories: CategoryWithRelations[]) {
    return categories.map((category) => this.toMenuItemDTO(category));
  }

  static sanitizeForCache(category: CategoryWithRelations): unknown {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      description: category.description,
      type: category.type,
      image: category.image,
      icon: category.icon,
      parentId: category.parentId,
      order: category.order,
      isActive: category.isActive,
      isFeatured: category.isFeatured,
      productCount: category._count?.products || 0,
      createdAt: category.createdAt.toISOString(),
      updatedAt: category.updatedAt.toISOString(),
    };
  }

  static fromCache(cached: Record<string, unknown>): CategoryResponseDTO {
    return {
      id: cached.id as string,
      name: cached.name as string,
      slug: cached.slug as string,
      description: cached.description as string | null,
      type: cached.type as CategoryType,
      image: cached.image as string | null,
      icon: cached.icon as string | null,
      parentId: cached.parentId as string | null,
      order: cached.order as number,
      isActive: cached.isActive as boolean,
      isFeatured: cached.isFeatured as boolean,
      metaTitle: cached.metaTitle as string | null,
      metaDescription: cached.metaDescription as string | null,
      metaKeywords: cached.metaKeywords as string | null,
      parent: cached.parent as CategoryParent | null | undefined,
      children: cached.children as CategoryChild[] | undefined,
      productCount: cached.productCount as number | undefined,
      createdAt: new Date(cached.createdAt as string),
      updatedAt: new Date(cached.updatedAt as string),
    };
  }

  static toSearchResult(category: CategoryWithRelations, path: string[] = []) {
    return {
      id: category.id,
      name: category.name,
      slug: category.slug,
      type: category.type as CategoryType,
      image: category.image,
      productCount: category._count?.products || 0,
      path,
    };
  }

  static flattenHierarchy(categories: CategoryWithRelations[]): CategoryWithRelations[] {
    const flattened: CategoryWithRelations[] = [];

    const flatten = (cats: CategoryWithRelations[]) => {
      cats.forEach((cat) => {
        flattened.push(cat);
        if (cat.children && cat.children.length > 0) {
          flatten(cat.children as CategoryWithRelations[]);
        }
      });
    };

    flatten(categories);
    return flattened;
  }

  static filterActive(categories: CategoryWithRelations[]): CategoryWithRelations[] {
    return categories.filter((cat) => cat.isActive);
  }

  static sortByOrder(categories: CategoryWithRelations[]): CategoryWithRelations[] {
    return [...categories].sort((a, b) => a.order - b.order);
  }

  static sortByName(categories: CategoryWithRelations[]): CategoryWithRelations[] {
    return [...categories].sort((a, b) => a.name.localeCompare(b.name));
  }
}