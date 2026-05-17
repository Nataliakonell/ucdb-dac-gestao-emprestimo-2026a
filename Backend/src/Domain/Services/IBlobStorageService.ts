export interface IBlobStorageService {
  uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string>;
  deleteFile(fileName: string): Promise<void>;
  getFile(fileName: string): Promise<{ body: any; contentType?: string }>;
}
