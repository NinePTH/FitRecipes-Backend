import sharp from 'sharp';
import { supabaseClient } from './supabase';

/**
 * Image upload configuration
 */
export const IMAGE_CONFIG = {
  maxFileSize: 5 * 1024 * 1024, // 5MB
  allowedMimeTypes: [
    'image/jpeg',
    'image/png',
    'image/webp',
    'image/gif',
  ] as const,
  allowedExtensions: ['.jpg', '.jpeg', '.png', '.webp', '.gif'],
  minWidth: 400,
  minHeight: 300,
  maxWidth: 4000,
  maxHeight: 3000,
  recommendedWidth: 1200,
  recommendedHeight: 900,
  optimizeQuality: 85,
} as const;

type AllowedMimeType = (typeof IMAGE_CONFIG.allowedMimeTypes)[number];

/**
 * Image upload result interface
 */
export interface ImageUploadResult {
  imageUrl: string;
  publicId: string;
  width: number;
  height: number;
  format: string;
  size: number;
}

/**
 * Validate image file type
 */
export function validateFileType(mimeType: string, filename: string): boolean {
  // Check MIME type
  if (!IMAGE_CONFIG.allowedMimeTypes.includes(mimeType as AllowedMimeType)) {
    return false;
  }

  // Check file extension
  const extension = filename.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/);
  if (!extension) {
    return false;
  }

  return true;
}

/**
 * Validate image file size
 */
export function validateFileSize(size: number): boolean {
  return size > 0 && size <= IMAGE_CONFIG.maxFileSize;
}

/**
 * Sanitize filename - remove special characters and use UUID
 */
export function sanitizeFilename(originalFilename: string): string {
  // Get file extension
  const extension =
    originalFilename.toLowerCase().match(/\.(jpg|jpeg|png|webp|gif)$/)?.[0] ||
    '.jpg';

  // Generate unique filename with timestamp and random string
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);

  return `recipe-${timestamp}-${randomString}${extension}`;
}

/**
 * Validate and get image metadata
 */
export async function validateImage(buffer: Buffer): Promise<{
  width: number;
  height: number;
  format: string;
  size: number;
}> {
  try {
    const metadata = await sharp(buffer).metadata();

    if (!metadata.width || !metadata.height) {
      throw new Error('Unable to read image dimensions');
    }

    // Validate dimensions
    if (
      metadata.width < IMAGE_CONFIG.minWidth ||
      metadata.height < IMAGE_CONFIG.minHeight
    ) {
      throw new Error(
        `Image dimensions must be at least ${IMAGE_CONFIG.minWidth}x${IMAGE_CONFIG.minHeight} pixels`
      );
    }

    if (
      metadata.width > IMAGE_CONFIG.maxWidth ||
      metadata.height > IMAGE_CONFIG.maxHeight
    ) {
      throw new Error(
        `Image dimensions must not exceed ${IMAGE_CONFIG.maxWidth}x${IMAGE_CONFIG.maxHeight} pixels`
      );
    }

    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format || 'unknown',
      size: buffer.length,
    };
  } catch (error) {
    if (error instanceof Error && error.message.includes('dimensions')) {
      throw error;
    }
    throw new Error('Invalid image file. Please upload a valid image.');
  }
}

/**
 * Optimize image - resize if too large and compress
 */
export async function optimizeImage(buffer: Buffer): Promise<Buffer> {
  try {
    const metadata = await sharp(buffer).metadata();

    let transformer = sharp(buffer);

    // Resize if image is too large
    if (
      metadata.width &&
      metadata.height &&
      (metadata.width > IMAGE_CONFIG.recommendedWidth ||
        metadata.height > IMAGE_CONFIG.recommendedHeight)
    ) {
      transformer = transformer.resize(
        IMAGE_CONFIG.recommendedWidth,
        IMAGE_CONFIG.recommendedHeight,
        {
          fit: 'inside', // Maintain aspect ratio
          withoutEnlargement: true, // Don't upscale small images
        }
      );
    }

    // Optimize based on format
    const format = metadata.format;
    if (format === 'jpeg' || format === 'jpg') {
      transformer = transformer.jpeg({ quality: IMAGE_CONFIG.optimizeQuality });
    } else if (format === 'png') {
      transformer = transformer.png({ quality: IMAGE_CONFIG.optimizeQuality });
    } else if (format === 'webp') {
      transformer = transformer.webp({ quality: IMAGE_CONFIG.optimizeQuality });
    }

    return await transformer.toBuffer();
  } catch (error) {
    // If optimization fails, return original buffer
    console.error('Image optimization failed:', error);
    return buffer;
  }
}

/**
 * Upload image to Supabase Storage with all validations and optimizations
 */
export async function uploadRecipeImage(
  buffer: Buffer,
  filename: string,
  mimeType: string
): Promise<ImageUploadResult> {
  // 1. Validate file type
  if (!validateFileType(mimeType, filename)) {
    throw new Error(
      'Invalid file type. Only JPEG, PNG, WebP, and GIF are allowed'
    );
  }

  // 2. Validate file size
  if (!validateFileSize(buffer.length)) {
    throw new Error('File size exceeds 5MB limit');
  }

  // 3. Validate image and get metadata
  const metadata = await validateImage(buffer);

  // 4. Optimize image
  const optimizedBuffer = await optimizeImage(buffer);

  // 5. Sanitize filename
  const sanitizedFilename = sanitizeFilename(filename);

  // 6. Upload to Supabase
  try {
    const uploadResult = await supabaseClient.uploadFile(
      optimizedBuffer,
      sanitizedFilename,
      'recipes'
    );

    // 7. Get final metadata after optimization
    const finalMetadata = await sharp(optimizedBuffer).metadata();

    return {
      imageUrl: uploadResult.publicUrl,
      publicId: uploadResult.path,
      width: finalMetadata.width || metadata.width,
      height: finalMetadata.height || metadata.height,
      format: finalMetadata.format || metadata.format,
      size: optimizedBuffer.length,
    };
  } catch (error) {
    throw new Error(
      `Failed to upload image: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

/**
 * Delete recipe image from Supabase Storage
 */
export async function deleteRecipeImage(publicId: string): Promise<boolean> {
  try {
    return await supabaseClient.deleteFile(publicId);
  } catch (error) {
    console.error('Failed to delete image:', error);
    return false;
  }
}

/**
 * Extract public ID from image URL
 */
export function extractPublicIdFromUrl(imageUrl: string): string | null {
  try {
    // Extract path from Supabase URL
    // Example: https://xxx.supabase.co/storage/v1/object/public/recipe-images/recipes/recipe-123.jpg
    const match = imageUrl.match(/\/recipes\/[^?]+/);
    return match ? match[0].substring(1) : null; // Remove leading slash
  } catch (error) {
    console.error('Failed to extract public ID from URL:', error);
    return null;
  }
}
