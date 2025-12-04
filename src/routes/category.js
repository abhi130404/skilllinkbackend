const express = require("express");
const router = express.Router();
const ctrl = require("../controllers/categoryController");


router.post('/categories', ctrl.createCategory);

// Get full category tree (non-deleted items only)
router.get('/categories/tree', ctrl.getCategoryTree);
router.get('/categories', ctrl.getCategories);
router.get('/subcategories', ctrl.getSubCategories);
router.get('/topics', ctrl.getTopics);
// Soft delete a category
router.delete('/categories/:id', ctrl.deleteCategory);

// Restore a soft-deleted category
router.put('/category/:id/update', ctrl.updateCategory);
router.put('/subcategory/:id/update', ctrl.updateSubCategory);
router.put('/topic/:id/update', ctrl.updateTopic);
/* -----------------------------------------------------
    SUBCATEGORY ROUTES
----------------------------------------------------- */

// Create a new subcategory
router.post('/subcategories', ctrl.createSubCategory);

// Soft delete a subcategory
router.delete('/subcategories/:id', ctrl.deleteSubCategory);

/* -----------------------------------------------------
    TOPIC ROUTES
----------------------------------------------------- */

// Create a new topic
router.post('/topics', ctrl.createTopic);

// Soft delete a topic
router.delete('/topics/:id', ctrl.deleteTopic);

/* -----------------------------------------------------
    IMPORT ROUTES (File-based imports)
----------------------------------------------------- */

// Import categories from file (CSV/Excel)
router.post('/import/categories', ctrl.importCategoriesFromFile);

// Import subcategories from file (CSV/Excel)
router.post('/import/subcategories', ctrl.importSubCategoriesFromFile);

// Import topics from file (CSV/Excel)
router.post('/import/topics', ctrl.importTopicsFromFile);

// Bulk import all (categories, subcategories, topics)
router.post('/import/bulk', ctrl.bulkImportAll);

module.exports = router;
