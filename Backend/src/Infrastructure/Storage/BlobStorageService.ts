
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from "@aws-sdk/client-s3";
import { IBlobStorageService } from "../../Domain/Services/IBlobStorageService";

export class BlobStorageService implements IBlobStorageService {
  private s3Client: S3Client;
  private bucketName: string;
  private publicUrl: string;

  constructor() {
    const endpoint = process.env.S3_ENDPOINT || "";
    const accessKeyId = process.env.S3_ACCESS_KEY_ID || "";
    const secretAccessKey = process.env.S3_SECRET_ACCESS_KEY || "";
    this.bucketName = process.env.S3_BUCKET_NAME || "";
    this.publicUrl = process.env.STORAGE_PUBLIC_URL || `${endpoint}/${this.bucketName}`;

    this.s3Client = new S3Client({
      region: "auto", // Cloudflare R2 requires region to be "auto"
      endpoint,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    console.log(`[Storage] Cloudflare R2 inicializado. Balde: "${this.bucketName}"`);
  }

  async uploadFile(fileBuffer: Buffer, fileName: string, mimeType: string): Promise<string> {
    try {
      const command = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
        Body: fileBuffer,
        ContentType: mimeType,
      });

      await this.s3Client.send(command);
      console.log(`[Storage] Upload bem-sucedido no R2: ${fileName}`);
      return `${this.publicUrl}/${fileName}`;
    } catch (err: any) {
      console.error("[Storage] Erro no upload para o Cloudflare R2:", err.message);
      throw new Error(`Falha no upload do armazenamento: ${err.message}`);
    }
  }

  async deleteFile(fileName: string): Promise<void> {
    try {
      const command = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      await this.s3Client.send(command);
      console.log(`[Storage] Arquivo removido do R2: ${fileName}`);
    } catch (err: any) {
      console.error("[Storage] Erro ao deletar arquivo no Cloudflare R2:", err.message);
      throw new Error(`Falha na remoção do armazenamento: ${err.message}`);
    }
  }

  async getFile(fileName: string): Promise<{ body: any; contentType?: string }> {
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      });

      const response = await this.s3Client.send(command);
      return {
        body: response.Body,
        contentType: response.ContentType,
      };
    } catch (err: any) {
      console.error("[Storage] Erro ao obter arquivo no Cloudflare R2:", err.message);
      throw new Error(`Falha ao obter arquivo do armazenamento: ${err.message}`);
    }
  }
}
