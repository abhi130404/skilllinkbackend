const asyncHandler = require("express-async-handler");
const { Category, Topic, SubCategory } = require("../models/models");
const axios = require('axios');

const { determineFileType, parseFileData, generateUniqueSlug, generateSlug } = require("../utils/commonFunctions");

/* -----------------------------------------------------
    IMPORT CATEGORIES FROM FILE
----------------------------------------------------- */
const importCategoriesFromFile = asyncHandler(async (req, res) => {
  try {
    const { fileUrl } = req.body;
    
    if (!fileUrl) {
      return res.status(400).json({ 
        code: 1, 
        message: "File URL is required" 
      });
    }

    // Determine file type from URL
    const fileType = determineFileType(fileUrl);
    if (!fileType) {
      return res.status(400).json({ 
        code: 1, 
        message: "Unable to determine file type from URL. Please provide .csv, .xlsx, or .xls file" 
      });
    }

    // Download the file
    const response = await axios.get(fileUrl, { 
      responseType: 'arraybuffer',
      timeout: 30000
    });
    const fileBuffer = Buffer.from(response.data);

    // Parse the file
    let categories;
    try {
      categories = await parseFileData(fileBuffer, fileType);
    } catch (parseError) {
      return res.status(400).json({ 
        code: 1, 
        message: `Failed to parse ${fileType.toUpperCase()} file: ${parseError.message}` 
      });
    }

    if (!categories || categories.length === 0) {
      return res.status(400).json({ 
        code: 1, 
        message: "No data found in the file" 
      });
    }

    // Validate and process categories
    const results = {
      successful: 0,
      failed: 0,
      errors: [],
      fileType: fileType,
      totalRows: categories.length
    };
    
    for (const categoryData of categories) {
      try {
        // Validate required fields
        if (!categoryData.name) {
          results.failed++;
          results.errors.push({
            row: JSON.stringify(categoryData),
            error: "Missing name"
          });
          continue;
        }

        // Generate slug from name if not provided
        const baseSlug = categoryData.slug 
          ? generateSlug(categoryData.slug)
          : generateSlug(categoryData.name);
        
        // Generate unique slug
        const uniqueSlug = await generateUniqueSlug(Category, baseSlug);

        // Check if category already exists by name (including deleted ones for restoration)
        const existingCategory = await Category.findOne({ 
          name: categoryData.name.trim() 
        });

        if (existingCategory) {
          // If category was deleted, restore it
          if (existingCategory.isDeleted) {
            existingCategory.isDeleted = false;
          }
          
          // Update existing category
          existingCategory.slug = uniqueSlug;
          existingCategory.image = categoryData.image || existingCategory.image;
          existingCategory.isDeleted = categoryData.isDeleted !== undefined 
            ? categoryData.isDeleted === 'true' || categoryData.isDeleted === true
            : false; // Default to active (not deleted)
          
          await existingCategory.save();
          results.successful++;
        } else {
          // Create new category
          await Category.create({
            name: categoryData.name.trim(),
            slug: uniqueSlug,
            image: categoryData.image || '',
            isDeleted: categoryData.isDeleted !== undefined 
              ? categoryData.isDeleted === 'true' || categoryData.isDeleted === true
              : false // Default to active (not deleted)
          });
          results.successful++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: JSON.stringify(categoryData),
          error: error.message
        });
      }
    }

    return res.json({
      code: 0,
      message: `Import completed. Successful: ${results.successful}, Failed: ${results.failed}`,
      data: results
    });

  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      return res.status(400).json({ 
        code: 1, 
        message: "Cannot access the file URL. Please check if the URL is valid and accessible" 
      });
    }
    return res.status(500).json({ 
      code: 1, 
      message: err.message 
    });
  }
});

/* -----------------------------------------------------
    IMPORT SUBCATEGORIES FROM FILE
----------------------------------------------------- */
const importSubCategoriesFromFile = asyncHandler(async (req, res) => {
  try {
    const { fileUrl } = req.body;
    
    if (!fileUrl) {
      return res.status(400).json({ 
        code: 1, 
        message: "File URL is required" 
      });
    }

    // Determine file type from URL
    const fileType = determineFileType(fileUrl);
    if (!fileType) {
      return res.status(400).json({ 
        code: 1, 
        message: "Unable to determine file type from URL. Please provide .csv, .xlsx, or .xls file" 
      });
    }

    // Download the file
    const response = await axios.get(fileUrl, { 
      responseType: 'arraybuffer',
      timeout: 30000
    });
    const fileBuffer = Buffer.from(response.data);

    // Parse the file
    let subcategories;
    try {
      subcategories = await parseFileData(fileBuffer, fileType);
    } catch (parseError) {
      return res.status(400).json({ 
        code: 1, 
        message: `Failed to parse ${fileType.toUpperCase()} file: ${parseError.message}` 
      });
    }

    if (!subcategories || subcategories.length === 0) {
      return res.status(400).json({ 
        code: 1, 
        message: "No data found in the file" 
      });
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [],
      fileType: fileType,
      totalRows: subcategories.length
    };

    for (const subcatData of subcategories) {
      try {
        // Validate required fields
        if (!subcatData.categoryName || !subcatData.name) {
          results.failed++;
          results.errors.push({
            row: JSON.stringify(subcatData),
            error: "Missing categoryName or name"
          });
          continue;
        }

        // Find category by name
        const category = await Category.findOne({ 
          name: subcatData.categoryName.trim(),
          isDeleted: false 
        });
        if (!category) {
          results.failed++;
          results.errors.push({
            row: JSON.stringify(subcatData),
            error: `Active category not found: ${subcatData.categoryName}`
          });
          continue;
        }

        // Generate slug from name if not provided
        const baseSlug = subcatData.slug 
          ? generateSlug(subcatData.slug)
          : generateSlug(subcatData.name);
        
        // Generate unique slug
        const uniqueSlug = await generateUniqueSlug(SubCategory, baseSlug);

        // Check if subcategory already exists by name within same category
        const existingSubCat = await SubCategory.findOne({ 
          name: subcatData.name.trim(),
          categoryId: category._id
        });

        if (existingSubCat) {
          // If subcategory was deleted, restore it
          if (existingSubCat.isDeleted) {
            existingSubCat.isDeleted = false;
          }
          
          // Update existing subcategory
          existingSubCat.slug = uniqueSlug;
          existingSubCat.categoryName = category.name; // Add categoryName
          existingSubCat.image = subcatData.image || existingSubCat.image;
          existingSubCat.isDeleted = subcatData.isDeleted !== undefined 
            ? subcatData.isDeleted === 'true' || subcatData.isDeleted === true
            : false; // Default to active (not deleted)
          
          await existingSubCat.save();
          results.successful++;
        } else {
          // Create new subcategory
          await SubCategory.create({
            categoryId: category._id,
            name: subcatData.name.trim(),
            slug: uniqueSlug,
            categoryName: category.name, // Add categoryName
            image: subcatData.image || '',
            isDeleted: subcatData.isDeleted !== undefined 
              ? subcatData.isDeleted === 'true' || subcatData.isDeleted === true
              : false // Default to active (not deleted)
          });
          results.successful++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: JSON.stringify(subcatData),
          error: error.message
        });
      }
    }

    return res.json({
      code: 0,
      message: `Import completed. Successful: ${results.successful}, Failed: ${results.failed}`,
      data: results
    });

  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      return res.status(400).json({ 
        code: 1, 
        message: "Cannot access the file URL. Please check if the URL is valid and accessible" 
      });
    }
    return res.status(500).json({ 
      code: 1, 
      message: err.message 
    });
  }
});

/* -----------------------------------------------------
    IMPORT TOPICS FROM FILE
----------------------------------------------------- */
const importTopicsFromFile = asyncHandler(async (req, res) => {
  try {
    const { fileUrl } = req.body;
    
    if (!fileUrl) {
      return res.status(400).json({ 
        code: 1, 
        message: "File URL is required" 
      });
    }

    // Determine file type from URL
    const fileType = determineFileType(fileUrl);
    if (!fileType) {
      return res.status(400).json({ 
        code: 1, 
        message: "Unable to determine file type from URL. Please provide .csv, .xlsx, or .xls file" 
      });
    }

    // Download the file
    const response = await axios.get(fileUrl, { 
      responseType: 'arraybuffer',
      timeout: 30000
    });
    const fileBuffer = Buffer.from(response.data);

    // Parse the file
    let topics;
    try {
      topics = await parseFileData(fileBuffer, fileType);
    } catch (parseError) {
      return res.status(400).json({ 
        code: 1, 
        message: `Failed to parse ${fileType.toUpperCase()} file: ${parseError.message}` 
      });
    }

    if (!topics || topics.length === 0) {
      return res.status(400).json({ 
        code: 1, 
        message: "No data found in the file" 
      });
    }

    const results = {
      successful: 0,
      failed: 0,
      errors: [],
      fileType: fileType,
      totalRows: topics.length
    };

    for (const topicData of topics) {
      try {
        // Validate required fields
        if (!topicData.subCategoryName || !topicData.name) {
          results.failed++;
          results.errors.push({
            row: JSON.stringify(topicData),
            error: "Missing subCategoryName or name"
          });
          continue;
        }

        // Find subcategory by name
        const subcategory = await SubCategory.findOne({ 
          name: topicData.subCategoryName.trim(),
          isDeleted: false 
        });
        if (!subcategory) {
          results.failed++;
          results.errors.push({
            row: JSON.stringify(topicData),
            error: `Active subcategory not found: ${topicData.subCategoryName}`
          });
          continue;
        }

        // Generate slug from name if not provided
        const baseSlug = topicData.slug 
          ? generateSlug(topicData.slug)
          : generateSlug(topicData.name);
        
        // Generate unique slug
        const uniqueSlug = await generateUniqueSlug(Topic, baseSlug);

        // Check if topic already exists by name within same subcategory
        const existingTopic = await Topic.findOne({ 
          name: topicData.name.trim(),
          subCategoryId: subcategory._id
        });

        if (existingTopic) {
          // If topic was deleted, restore it
          if (existingTopic.isDeleted) {
            existingTopic.isDeleted = false;
          }
          
          // Update existing topic
          existingTopic.slug = uniqueSlug;
          existingTopic.subCategoryName = subcategory.name; // Add subCategoryName
          existingTopic.image = topicData.image || existingTopic.image;
          existingTopic.isDeleted = topicData.isDeleted !== undefined 
            ? topicData.isDeleted === 'true' || topicData.isDeleted === true
            : false; // Default to active (not deleted)
          
          await existingTopic.save();
          results.successful++;
        } else {
          // Create new topic
          await Topic.create({
            subCategoryId: subcategory._id,
            name: topicData.name.trim(),
            slug: uniqueSlug,
            subCategoryName: subcategory.name, // Add subCategoryName
            image: topicData.image || '',
            isDeleted: topicData.isDeleted !== undefined 
              ? topicData.isDeleted === 'true' || topicData.isDeleted === true
              : false // Default to active (not deleted)
          });
          results.successful++;
        }
      } catch (error) {
        results.failed++;
        results.errors.push({
          row: JSON.stringify(topicData),
          error: error.message
        });
      }
    }

    return res.json({
      code: 0,
      message: `Import completed. Successful: ${results.successful}, Failed: ${results.failed}`,
      data: results
    });

  } catch (err) {
    if (err.code === 'ENOTFOUND' || err.code === 'ECONNREFUSED') {
      return res.status(400).json({ 
        code: 1, 
        message: "Cannot access the file URL. Please check if the URL is valid and accessible" 
      });
    }
    return res.status(500).json({ 
      code: 1, 
      message: err.message 
    });
  }
});

/* -----------------------------------------------------
    BULK IMPORT ALL (Categories, SubCategories, Topics)
----------------------------------------------------- */
const bulkImportAll = asyncHandler(async (req, res) => {
  try {
    const { categoriesFileUrl, subcategoriesFileUrl, topicsFileUrl } = req.body;
    
    if (!categoriesFileUrl && !subcategoriesFileUrl && !topicsFileUrl) {
      return res.status(400).json({ 
        code: 1, 
        message: "At least one file URL is required" 
      });
    }

    const results = {
      categories: { successful: 0, failed: 0, errors: [], totalRows: 0 },
      subcategories: { successful: 0, failed: 0, errors: [], totalRows: 0 },
      topics: { successful: 0, failed: 0, errors: [], totalRows: 0 }
    };

    // Helper function to process each file
    const processFile = async (fileUrl, type) => {
      if (!fileUrl) return;
      
      const fileType = determineFileType(fileUrl);
      if (!fileType) {
        throw new Error(`Unable to determine file type from URL: ${fileUrl}`);
      }

      const response = await axios.get(fileUrl, { 
        responseType: 'arraybuffer',
        timeout: 30000
      });
      const fileBuffer = Buffer.from(response.data);
      
      return await parseFileData(fileBuffer, fileType);
    };

    // Import Categories
    if (categoriesFileUrl) {
      try {
        const categories = await processFile(categoriesFileUrl, 'categories');
        if (categories) {
          results.categories.totalRows = categories.length;
          
          for (const cat of categories) {
            try {
              if (!cat.name) {
                results.categories.failed++;
                results.categories.errors.push({
                  row: JSON.stringify(cat),
                  error: "Missing name"
                });
                continue;
              }
              
              // Generate unique slug
              const baseSlug = cat.slug ? generateSlug(cat.slug) : generateSlug(cat.name);
              const uniqueSlug = await generateUniqueSlug(Category, baseSlug);
              
              const existing = await Category.findOne({ 
                name: cat.name.trim() 
              });
              
              if (existing) {
                // If category was deleted, restore it
                if (existing.isDeleted) {
                  existing.isDeleted = false;
                }
                
                // Update existing category
                existing.slug = uniqueSlug;
                existing.image = cat.image || existing.image;
                existing.isDeleted = cat.isDeleted !== undefined 
                  ? cat.isDeleted === 'true' || cat.isDeleted === true
                  : false;
                await existing.save();
              } else {
                // Create new category
                await Category.create({
                  name: cat.name.trim(),
                  slug: uniqueSlug,
                  image: cat.image || '',
                  isDeleted: cat.isDeleted !== undefined 
                    ? cat.isDeleted === 'true' || cat.isDeleted === true
                    : false
                });
              }
              results.categories.successful++;
            } catch (error) {
              results.categories.failed++;
              results.categories.errors.push({
                row: JSON.stringify(cat),
                error: error.message
              });
            }
          }
        }
      } catch (error) {
        results.categories.errors.push({
          error: `Failed to process categories file: ${error.message}`
        });
      }
    }

    // Import SubCategories (must be after categories if both are provided)
    if (subcategoriesFileUrl) {
      try {
        const subcategories = await processFile(subcategoriesFileUrl, 'subcategories');
        if (subcategories) {
          results.subcategories.totalRows = subcategories.length;
          
          for (const sub of subcategories) {
            try {
              if (!sub.categoryName || !sub.name) {
                results.subcategories.failed++;
                results.subcategories.errors.push({
                  row: JSON.stringify(sub),
                  error: "Missing categoryName or name"
                });
                continue;
              }

              const category = await Category.findOne({ 
                name: sub.categoryName.trim(),
                isDeleted: false 
              });
              if (!category) {
                results.subcategories.failed++;
                results.subcategories.errors.push({
                  row: JSON.stringify(sub),
                  error: `Active category not found: ${sub.categoryName}`
                });
                continue;
              }

              // Generate unique slug
              const baseSlug = sub.slug ? generateSlug(sub.slug) : generateSlug(sub.name);
              const uniqueSlug = await generateUniqueSlug(SubCategory, baseSlug);

              const existing = await SubCategory.findOne({ 
                name: sub.name.trim(),
                categoryId: category._id
              });
              
              if (existing) {
                // If subcategory was deleted, restore it
                if (existing.isDeleted) {
                  existing.isDeleted = false;
                }
                
                existing.slug = uniqueSlug;
                existing.categoryName = category.name; // Add categoryName
                existing.image = sub.image || existing.image;
                existing.isDeleted = sub.isDeleted !== undefined 
                  ? sub.isDeleted === 'true' || sub.isDeleted === true
                  : false;
                await existing.save();
              } else {
                await SubCategory.create({
                  categoryId: category._id,
                  name: sub.name.trim(),
                  slug: uniqueSlug,
                  categoryName: category.name, // Add categoryName
                  image: sub.image || '',
                  isDeleted: sub.isDeleted !== undefined 
                    ? sub.isDeleted === 'true' || sub.isDeleted === true
                    : false
                });
              }
              results.subcategories.successful++;
            } catch (error) {
              results.subcategories.failed++;
              results.subcategories.errors.push({
                row: JSON.stringify(sub),
                error: error.message
              });
            }
          }
        }
      } catch (error) {
        results.subcategories.errors.push({
          error: `Failed to process subcategories file: ${error.message}`
        });
      }
    }

    // Import Topics (must be after subcategories if both are provided)
    if (topicsFileUrl) {
      try {
        const topics = await processFile(topicsFileUrl, 'topics');
        if (topics) {
          results.topics.totalRows = topics.length;
          
          for (const topic of topics) {
            try {
              if (!topic.subCategoryName || !topic.name) {
                results.topics.failed++;
                results.topics.errors.push({
                  row: JSON.stringify(topic),
                  error: "Missing subCategoryName or name"
                });
                continue;
              }

              const subcategory = await SubCategory.findOne({ 
                name: topic.subCategoryName.trim(),
                isDeleted: false 
              });
              if (!subcategory) {
                results.topics.failed++;
                results.topics.errors.push({
                  row: JSON.stringify(topic),
                  error: `Active subcategory not found: ${topic.subCategoryName}`
                });
                continue;
              }

              // Generate unique slug
              const baseSlug = topic.slug ? generateSlug(topic.slug) : generateSlug(topic.name);
              const uniqueSlug = await generateUniqueSlug(Topic, baseSlug);

              const existing = await Topic.findOne({ 
                name: topic.name.trim(),
                subCategoryId: subcategory._id
              });
              
              if (existing) {
                // If topic was deleted, restore it
                if (existing.isDeleted) {
                  existing.isDeleted = false;
                }
                
                existing.slug = uniqueSlug;
                existing.subCategoryName = subcategory.name; // Add subCategoryName
                existing.image = topic.image || existing.image;
                existing.isDeleted = topic.isDeleted !== undefined 
                  ? topic.isDeleted === 'true' || topic.isDeleted === true
                  : false;
                await existing.save();
              } else {
                await Topic.create({
                  subCategoryId: subcategory._id,
                  name: topic.name.trim(),
                  slug: uniqueSlug,
                  subCategoryName: subcategory.name, // Add subCategoryName
                  image: topic.image || '',
                  isDeleted: topic.isDeleted !== undefined 
                    ? topic.isDeleted === 'true' || topic.isDeleted === true
                    : false
                });
              }
              results.topics.successful++;
            } catch (error) {
              results.topics.failed++;
              results.topics.errors.push({
                row: JSON.stringify(topic),
                error: error.message
              });
            }
          }
        }
      } catch (error) {
        results.topics.errors.push({
          error: `Failed to process topics file: ${error.message}`
        });
      }
    }

    return res.json({
      code: 0,
      message: 'Bulk import completed',
      data: results
    });

  } catch (err) {
    return res.status(500).json({ 
      code: 1, 
      message: err.message 
    });
  }
});

/* -----------------------------------------------------
    CREATE CATEGORY
----------------------------------------------------- */
const createCategory = asyncHandler(async (req, res) => {
  try {
    const { name, image, isDeleted } = req.body;

    if (!name)
      return res.status(400).json({ code: 1, message: "Name is required" });

    // Generate unique slug
    const baseSlug = generateSlug(name);
    const uniqueSlug = await generateUniqueSlug(Category, baseSlug);

    const response = await Category.create({ 
      name, 
      slug: uniqueSlug, 
      image: image || '', 
      isDeleted: isDeleted || false 
    });

    return res.json({
      code: 0,
      message: "Category created successfully",
      data: response,
    });
  } catch (err) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});

/* -----------------------------------------------------
    CREATE SUBCATEGORY
----------------------------------------------------- */
const createSubCategory = asyncHandler(async (req, res) => {
  try {
    const { categoryId, name, image, isDeleted } = req.body;

    if (!categoryId || !name)
      return res.status(400).json({ code: 1, message: "CategoryId and name are required" });

    const category = await Category.findOne({ 
      _id: categoryId, 
      isDeleted: false 
    });
    if (!category)
      return res.status(400).json({ code: 1, message: "Invalid or deleted categoryId" });

    // Generate unique slug
    const baseSlug = generateSlug(name);
    const uniqueSlug = await generateUniqueSlug(SubCategory, baseSlug);

    const response = await SubCategory.create({
      categoryId,
      name,
      slug: uniqueSlug,
      categoryName: category.name, // Add categoryName
      image: image || '',
      isDeleted: isDeleted || false,
    });

    return res.json({
      code: 0,
      message: "Subcategory created successfully",
      data: response,
    });
  } catch (err) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});

/* -----------------------------------------------------
    CREATE TOPIC
----------------------------------------------------- */
const createTopic = asyncHandler(async (req, res) => {
  try {
    const { subCategoryId, name, image, isDeleted } = req.body;

    if (!subCategoryId || !name)
      return res.status(400).json({ code: 1, message: "SubCategoryId and name are required" });

    const subcategory = await SubCategory.findOne({ 
      _id: subCategoryId, 
      isDeleted: false 
    });
    if (!subcategory)
      return res.status(400).json({ code: 1, message: "Invalid or deleted subCategoryId" });

    // Generate unique slug
    const baseSlug = generateSlug(name);
    const uniqueSlug = await generateUniqueSlug(Topic, baseSlug);

    const response = await Topic.create({
      subCategoryId,
      name,
      slug: uniqueSlug,
      subCategoryName: subcategory.name, // Add subCategoryName
      image: image || '',
      isDeleted: isDeleted || false,
    });

    return res.json({
      code: 0,
      message: "Topic created successfully",
      data: response,
    });
  } catch (err) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});

/* -----------------------------------------------------
    UPDATE CATEGORY
----------------------------------------------------- */
const updateCategory = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { name, image, isDeleted } = req.body;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ code: 1, message: "Category not found" });
    }

    // If name is being updated, generate new slug
    if (name && name !== category.name) {
      const baseSlug = generateSlug(name);
      category.slug = await generateUniqueSlug(Category, baseSlug, id);
      category.name = name;
      
      // Update categoryName in all related SubCategories
      await SubCategory.updateMany(
        { categoryId: id },
        { $set: { categoryName: name } }
      );
    }

    // Update other fields
    if (image !== undefined) category.image = image;
    if (isDeleted !== undefined) category.isDeleted = isDeleted;

    await category.save();

    return res.json({
      code: 0,
      message: "Category updated successfully",
      data: category,
    });
  } catch (err) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});

/* -----------------------------------------------------
    UPDATE SUBCATEGORY
----------------------------------------------------- */
const updateSubCategory = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { categoryId, name, image, isDeleted } = req.body;

    const subcategory = await SubCategory.findById(id);
    if (!subcategory) {
      return res.status(404).json({ code: 1, message: "Subcategory not found" });
    }

    let updatedCategoryName = null;

    // If categoryId is being updated
    if (categoryId && categoryId !== subcategory.categoryId.toString()) {
      const category = await Category.findOne({ 
        _id: categoryId, 
        isDeleted: false 
      });
      if (!category) {
        return res.status(400).json({ code: 1, message: "Invalid or deleted categoryId" });
      }
      subcategory.categoryId = categoryId;
      subcategory.categoryName = category.name;
      updatedCategoryName = category.name;
    }

    // If name is being updated, generate new slug
    if (name && name !== subcategory.name) {
      const baseSlug = generateSlug(name);
      subcategory.slug = await generateUniqueSlug(SubCategory, baseSlug, id);
      subcategory.name = name;
      
      // Update subCategoryName in all related Topics
      await Topic.updateMany(
        { subCategoryId: id },
        { $set: { subCategoryName: name } }
      );
    }

    // Update other fields
    if (image !== undefined) subcategory.image = image;
    if (isDeleted !== undefined) subcategory.isDeleted = isDeleted;

    await subcategory.save();

    // If categoryName wasn't updated above but we have a valid categoryId, ensure categoryName is set
    if (!subcategory.categoryName && subcategory.categoryId) {
      const category = await Category.findById(subcategory.categoryId);
      if (category) {
        subcategory.categoryName = category.name;
        await subcategory.save();
      }
    }

    return res.json({
      code: 0,
      message: "Subcategory updated successfully",
      data: subcategory,
    });
  } catch (err) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});

/* -----------------------------------------------------
    UPDATE TOPIC
----------------------------------------------------- */
const updateTopic = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;
    const { subCategoryId, name, image, isDeleted } = req.body;

    const topic = await Topic.findById(id);
    if (!topic) {
      return res.status(404).json({ code: 1, message: "Topic not found" });
    }

    // If subCategoryId is being updated
    if (subCategoryId && subCategoryId !== topic.subCategoryId.toString()) {
      const subcategory = await SubCategory.findOne({ 
        _id: subCategoryId, 
        isDeleted: false 
      });
      if (!subcategory) {
        return res.status(400).json({ code: 1, message: "Invalid or deleted subCategoryId" });
      }
      topic.subCategoryId = subCategoryId;
      topic.subCategoryName = subcategory.name;
    }

    // If name is being updated, generate new slug
    if (name && name !== topic.name) {
      const baseSlug = generateSlug(name);
      topic.slug = await generateUniqueSlug(Topic, baseSlug, id);
      topic.name = name;
    }

    // Update other fields
    if (image !== undefined) topic.image = image;
    if (isDeleted !== undefined) topic.isDeleted = isDeleted;

    await topic.save();

    // If subCategoryName wasn't updated above but we have a valid subCategoryId, ensure subCategoryName is set
    if (!topic.subCategoryName && topic.subCategoryId) {
      const subcategory = await SubCategory.findById(topic.subCategoryId);
      if (subcategory) {
        topic.subCategoryName = subcategory.name;
        await topic.save();
      }
    }

    return res.json({
      code: 0,
      message: "Topic updated successfully",
      data: topic,
    });
  } catch (err) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});

/* -----------------------------------------------------
    GET FULL CATEGORY TREE (Only non-deleted items)
----------------------------------------------------- */
const getCategoryTree = asyncHandler(async (req, res) => {
  try {
    const categories = await Category.find({ isDeleted: false });
    const subcategories = await SubCategory.find({ isDeleted: false });
    const topics = await Topic.find({ isDeleted: false });

    const tree = categories.map(cat => {
      const subcats = subcategories.filter(
        sub => sub.categoryId.toString() === cat._id.toString()
      );

      return {
        ...cat._doc,
        subcategories: subcats.map(sc => ({
          ...sc._doc,
          topics: topics.filter(
            t => t.subCategoryId.toString() === sc._id.toString()
          ),
        })),
      };
    });

    return res.json({
      code: 0,
      message: "Category tree fetched",
      data: tree,
    });
  } catch (err) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});

/* -----------------------------------------------------
    SOFT DELETE CATEGORY
----------------------------------------------------- */
const deleteCategory = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const category = await Category.findById(id);
    if (!category) {
      return res.status(404).json({ code: 1, message: "Category not found" });
    }

    // Soft delete the category
    category.isDeleted = true;
    await category.save();

    // Optionally, also soft delete all related subcategories and topics
    await SubCategory.updateMany(
      { categoryId: id, isDeleted: false },
      { isDeleted: true }
    );
    
    const subcategories = await SubCategory.find({ categoryId: id });
    const subcategoryIds = subcategories.map(sub => sub._id);
    
    await Topic.updateMany(
      { subCategoryId: { $in: subcategoryIds }, isDeleted: false },
      { isDeleted: true }
    );

    return res.json({
      code: 0,
      message: "Category and its related items soft deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});

/* -----------------------------------------------------
    SOFT DELETE SUBCATEGORY
----------------------------------------------------- */
const deleteSubCategory = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const subcategory = await SubCategory.findById(id);
    if (!subcategory) {
      return res.status(404).json({ code: 1, message: "Subcategory not found" });
    }

    // Soft delete the subcategory
    subcategory.isDeleted = true;
    await subcategory.save();

    // Also soft delete all related topics
    await Topic.updateMany(
      { subCategoryId: id, isDeleted: false },
      { isDeleted: true }
    );

    return res.json({
      code: 0,
      message: "Subcategory and its related topics soft deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});

/* -----------------------------------------------------
    SOFT DELETE TOPIC
----------------------------------------------------- */
const deleteTopic = asyncHandler(async (req, res) => {
  try {
    const { id } = req.params;

    const topic = await Topic.findById(id);
    if (!topic) {
      return res.status(404).json({ code: 1, message: "Topic not found" });
    }

    // Soft delete the topic
    topic.isDeleted = true;
    await topic.save();

    return res.json({
      code: 0,
      message: "Topic soft deleted successfully",
    });
  } catch (err) {
    return res.status(500).json({ code: 1, message: err.message });
  }
});

/* -----------------------------------------------------
    RESTORE DELETED CATEGORY AND ITS RELATED ITEMS
----------------------------------------------------- */


/* -----------------------------------------------------
    GET CATEGORIES WITH FILTERS
----------------------------------------------------- */
const getCategories = asyncHandler(async (req, res) => {
  try {
    const searchText = req.query.searchText || "";
    const from = parseInt(req.query.from || "0");
    const size = parseInt(req.query.size || "20");

    const filter = { };

    // Search text filter
    if (searchText) {
      filter.$text = { $search: searchText };
    }

    // isDeleted filter → only apply if query param exists
    if (req.query.isDeleted !== undefined) {
      filter.isDeleted = req.query.isDeleted === "true"; 
      // converts "true"/"false" to boolean
    }

    // Total count
    const totalCount = await Category.countDocuments(filter);

    // Paginated data
    const categories = await Category.find(filter)
      .skip(from)
      .limit(size)
      .sort({ createdAt: -1 });

    return res.json({
      code: 0,
      data: categories,
      totalCount,
      message: "categories retrieved successfully"
    });

  } catch (error) {
    return res.status(500).json({ code: 1, message: error.message });
  }
});

/* -----------------------------------------------------
    GET SUBCATEGORIES WITH FILTERS
----------------------------------------------------- */
const getSubCategories = asyncHandler(async (req, res) => {
  try {
    const searchText = req.query.searchText || "";
    const from = parseInt(req.query.from || "0");
    const size = parseInt(req.query.size || "20");

    const filter = { };

    // Search text filter
    if (searchText) {
      filter.$text = { $search: searchText };
    }

    // isDeleted filter → only apply if query param exists
    if (req.query.isDeleted !== undefined) {
      filter.isDeleted = req.query.isDeleted === "true"; 
      // converts "true"/"false" to boolean
    }

    // Total count
    const totalCount = await SubCategory.countDocuments(filter);

    // Paginated data
    const subCategories = await SubCategory.find(filter)
      .skip(from)
      .limit(size)
      .sort({ createdAt: -1 });

    return res.json({
      code: 0,
      data: subCategories,
      totalCount,
      message: "subCategories retrieved successfully"
    });

  } catch (error) {
    return res.status(500).json({ code: 1, message: error.message });
  }
});

/* -----------------------------------------------------
    GET TOPICS WITH FILTERS
----------------------------------------------------- */
const getTopics = asyncHandler(async (req, res) => {
  try {
    const searchText = req.query.searchText || "";
    const from = parseInt(req.query.from || "0");
    const size = parseInt(req.query.size || "20");

    const filter = { };

    // Search text filter
    if (searchText) {
      filter.$text = { $search: searchText };
    }

    // isDeleted filter → only apply if query param exists
    if (req.query.isDeleted !== undefined) {
      filter.isDeleted = req.query.isDeleted === "true"; 
      // converts "true"/"false" to boolean
    }

    // Total count
    const totalCount = await Topic.countDocuments(filter);

    // Paginated data
    const topics = await Topic.find(filter)
      .skip(from)
      .limit(size)
      .sort({ createdAt: -1 });

    return res.json({
      code: 0,
      data: topics,
      totalCount,
      message: "topics retrieved successfully"
    });

  } catch (error) {
    return res.status(500).json({ code: 1, message: error.message });
  }
});

module.exports = {
  createCategory,
  createSubCategory,
  createTopic,
  updateCategory,
  updateSubCategory,
  updateTopic,
  getCategoryTree,
  importCategoriesFromFile,
  importSubCategoriesFromFile,
  importTopicsFromFile,
  bulkImportAll,
  deleteCategory,
  deleteSubCategory,
  deleteTopic,
  getCategories,
  getSubCategories,
  getTopics
};