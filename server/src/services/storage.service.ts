import { Client } from 'minio';
import dotenv from 'dotenv';
dotenv.config();

const endpoint = process.env.MINIO_ENDPOINT || 'localhost';
const port = parseInt(process.env.MINIO_PORT || '9000', 10);
const accessKey = process.env.MINIO_ACCESS_KEY || 'minioadmin';
const secretKey = process.env.MINIO_SECRET_KEY || 'minioadmin';
export const bucketName = process.env.MINIO_BUCKET_NAME || 'workspace-attachments';

export const minioClient = new Client({
  endPoint: endpoint,
  port: port,
  useSSL: false, // Use true in production if you have HTTPS
  accessKey: accessKey,
  secretKey: secretKey,
});

// Initialize bucket
export const initMinio = async () => {
  try {
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`Bucket ${bucketName} created successfully.`);
    } else {
      console.log(`Bucket ${bucketName} already exists.`);
    }
  } catch (error) {
    console.error('Error initializing MinIO:', error);
  }
};

export const generatePresignedUrl = async (objectName: string, expiryInSeconds = 3600) => {
  try {
    return await minioClient.presignedGetObject(bucketName, objectName, expiryInSeconds);
  } catch (error) {
    console.error('Error generating presigned URL:', error);
    throw new Error('Failed to generate secure download link');
  }
};
