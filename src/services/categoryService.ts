import prisma from '@/config/database'

export class CategoryService {
  static async getAllCategories() {
    return prisma.category.findMany({
      orderBy: { name: 'asc' },
      include: {
        _count: {
          select: {
            recipes: {
              where: {
                status: 'APPROVED',
              },
            },
          },
        },
      },
    })
  }

  static async getCategoryById(id: string) {
    return prisma.category.findUnique({
      where: { id },
      include: {
        _count: {
          select: {
            recipes: {
              where: {
                status: 'APPROVED',
              },
            },
          },
        },
      },
    })
  }

  static async createCategory(name: string, description?: string) {
    return prisma.category.create({
      data: {
        name,
        description,
      },
    })
  }

  static async updateCategory(id: string, data: { name?: string; description?: string }) {
    return prisma.category.update({
      where: { id },
      data,
    })
  }

  static async deleteCategory(id: string) {
    // Check if category has recipes
    const recipeCount = await prisma.recipe.count({
      where: { categoryId: id },
    })

    if (recipeCount > 0) {
      throw new Error('Cannot delete category with existing recipes')
    }

    return prisma.category.delete({
      where: { id },
    })
  }
}