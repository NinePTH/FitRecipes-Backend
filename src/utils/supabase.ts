import { createClient } from '@supabase/supabase-js';
import { FileUploadResult } from '@/types';
import config from '@/config';

export class SupabaseClient {
  private client;
  private bucketName: string;

  constructor() {
    this.bucketName = config.supabase.storageBucket;

    this.client = createClient(
      config.supabase.url,
      config.supabase.serviceRoleKey
    );
  }

  /**
   * Upload a file to Supabase Storage
   */
  async uploadFile(
    file: File | Buffer,
    fileName: string,
    folder = 'recipes'
  ): Promise<FileUploadResult> {
    try {
      const filePath = `${folder}/${Date.now()}-${fileName}`;

      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) {
        throw new Error(`Upload failed: ${error.message}`);
      }

      const { data: publicData } = this.client.storage
        .from(this.bucketName)
        .getPublicUrl(filePath);

      return {
        url: data.path,
        path: filePath,
        publicUrl: publicData.publicUrl,
      };
    } catch (error) {
      throw new Error(
        `File upload error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Delete a file from Supabase Storage
   */
  async deleteFile(filePath: string): Promise<boolean> {
    try {
      const { error } = await this.client.storage
        .from(this.bucketName)
        .remove([filePath]);

      if (error) {
        throw new Error(`Delete failed: ${error.message}`);
      }

      return true;
    } catch (error) {
      throw new Error(
        `File deletion error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Get public URL for a file
   */
  getPublicUrl(filePath: string): string {
    const { data } = this.client.storage
      .from(this.bucketName)
      .getPublicUrl(filePath);

    return data.publicUrl;
  }

  /**
   * List files in a folder
   */
  async listFiles(folder = 'recipes'): Promise<any[]> {
    try {
      const { data, error } = await this.client.storage
        .from(this.bucketName)
        .list(folder);

      if (error) {
        throw new Error(`List files failed: ${error.message}`);
      }

      return data || [];
    } catch (error) {
      throw new Error(
        `List files error: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }
}

// Export singleton instance
export const supabaseClient = new SupabaseClient();
