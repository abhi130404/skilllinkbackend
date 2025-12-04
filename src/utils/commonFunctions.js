const path = require('path');
const XLSX = require('xlsx');
const csv = require('csv-parser');
const { Readable } = require('stream');

/* -----------------------------------------------------
    HELPER: GENERATE SLUG
----------------------------------------------------- */
const generateSlug = (text) => {
  if (!text) return '';
  
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')           // Replace spaces with -
    .replace(/&/g, '-and-')         // Replace & with 'and'
    .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
    .replace(/\-\-+/g, '-')         // Replace multiple - with single -
    .replace(/^-+/, '')             // Trim - from start of text
    .replace(/-+$/, '');            // Trim - from end of text
};

/* -----------------------------------------------------
    HELPER: GENERATE UNIQUE SLUG
----------------------------------------------------- */
const generateUniqueSlug = async (Model, baseSlug, field = 'slug') => {
  let slug = baseSlug;
  let counter = 1;
  
  // Check if slug exists (excluding deleted items)
  let exists = await Model.findOne({ 
    [field]: slug,
    isDeleted: false 
  });
  
  // If slug exists, append number until we find unique one
  while (exists) {
    slug = `${baseSlug}-${counter}`;
    exists = await Model.findOne({ 
      [field]: slug,
      isDeleted: false 
    });
    counter++;
  }
  
  return slug;
};

/* -----------------------------------------------------
    HELPER: DETERMINE FILE TYPE FROM URL
----------------------------------------------------- */
const determineFileType = (fileUrl) => {
  if (!fileUrl) return null;
  
  const url = fileUrl.toLowerCase();
  const extension = path.extname(url).toLowerCase();
  
  if (extension === '.csv') {
    return 'csv';
  } else if (extension === '.xlsx' || extension === '.xls') {
    return 'excel';
  } else if (url.includes('.csv')) {
    return 'csv';
  } else if (url.includes('.xlsx') || url.includes('.xls')) {
    return 'excel';
  }
  
  return 'excel';
};

/* -----------------------------------------------------
    HELPER: PARSE FILE BASED ON TYPE
----------------------------------------------------- */
const parseFileData = async (buffer, fileType) => {
  let data = [];
  
  if (fileType === 'csv') {
    const readableStream = Readable.from(buffer.toString());
    await new Promise((resolve, reject) => {
      readableStream
        .pipe(csv())
        .on('data', (row) => {
          data.push(row);
        })
        .on('end', resolve)
        .on('error', reject);
    });
  } else if (fileType === 'excel') {
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    data = XLSX.utils.sheet_to_json(worksheet);
  }
  
  return data;
};

// Export as CommonJS module
module.exports = {
  generateSlug,
  generateUniqueSlug,
  determineFileType,
  parseFileData
};