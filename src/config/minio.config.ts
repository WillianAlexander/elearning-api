import { registerAs } from '@nestjs/config';

export const minioConfig = registerAs('minio', () => ({
  useMock: (process.env['MINIO_USE_MOCK'] ?? 'true') === 'true',
  endpoint: process.env['MINIO_ENDPOINT'] ?? 'localhost',
  port: parseInt(process.env['MINIO_PORT'] ?? '9000', 10),
  useSSL: process.env['MINIO_USE_SSL'] === 'true',
  accessKey: process.env['MINIO_ACCESS_KEY'] ?? 'minio_access_key',
  secretKey: process.env['MINIO_SECRET_KEY'] ?? 'minio_secret_key',
  bucket: process.env['MINIO_BUCKET'] ?? 'lms-files',
}));
