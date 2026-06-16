const prisma = require('../config/database');

/**
 * Get all categories for authenticated user.
 */
async function getCategories(req, res) {
  try {
    const categories = await prisma.category.findMany({
      where: { userId: req.user.id },
      orderBy: { createdAt: 'asc' },
    });
    res.json({ categories });
  } catch (error) {
    console.error('Get categories error:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
}

/**
 * Create a new category.
 */
async function createCategory(req, res) {
  try {
    const { name } = req.body;

    const existing = await prisma.category.findFirst({
      where: { userId: req.user.id, name },
    });

    if (existing) {
      return res.status(409).json({ error: 'Category already exists' });
    }

    const category = await prisma.category.create({
      data: { userId: req.user.id, name },
    });

    res.status(201).json({ category });
  } catch (error) {
    console.error('Create category error:', error);
    res.status(500).json({ error: 'Failed to create category' });
  }
}

/**
 * Update a category.
 */
async function updateCategory(req, res) {
  try {
    const { name } = req.body;

    const category = await prisma.category.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const updated = await prisma.category.update({
      where: { id: req.params.id },
      data: { name },
    });

    res.json({ category: updated });
  } catch (error) {
    console.error('Update category error:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
}

/**
 * Delete a category.
 */
async function deleteCategory(req, res) {
  try {
    const category = await prisma.category.findFirst({
      where: { id: req.params.id, userId: req.user.id },
    });

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    await prisma.category.delete({ where: { id: req.params.id } });
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Delete category error:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
}

module.exports = { getCategories, createCategory, updateCategory, deleteCategory };
