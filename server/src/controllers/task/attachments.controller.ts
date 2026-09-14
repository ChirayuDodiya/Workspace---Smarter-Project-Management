import { Request, Response } from 'express';
import { asyncHandler } from '../../utils/asyncHandler.js';
import { errorResponse, successResponse } from '../../utils/response.js';
import prisma from '../../prisma/client.js';
import { minioClient, bucketName, generatePresignedUrl } from '../../services/storage.service.js';
import multer from 'multer';

// Use memory storage for multer so we can stream it to MinIO
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 50 * 1024 * 1024, // 50MB limit
  },
});

export const uploadAttachmentMiddleware = upload.array('files', 10);

export const uploadAttachment = asyncHandler(async (req: Request, res: Response) => {
  const taskId = parseInt(req.params.id as string);
  const userId = (req as any).user.id;
  const files = req.files as Express.Multer.File[];

  if (!files || files.length === 0) {
    return errorResponse(res, 'No files provided', 400);
  }

  // Find task and project to construct path
  const task = await prisma.tasks.findUnique({
    where: { id: taskId, deleted_at: null },
    include: { projects: true },
  });

  if (!task || !task.projects) {
    return errorResponse(res, 'Task not found', 404);
  }

  const projectSlug = task.projects.slug;
  const uploadedAttachments = [];

  try {
    for (const file of files) {
      const timestamp = Date.now();
      const safeOriginalName = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const objectName = `${projectSlug}/task-${taskId}/${timestamp}-${safeOriginalName}`;

      // Upload to MinIO
      await minioClient.putObject(
        bucketName,
        objectName,
        file.buffer,
        file.size,
        { 'Content-Type': file.mimetype }
      );

      // Save metadata in DB
      const attachment = await prisma.task_attachments.create({
        data: {
          task_id: taskId,
          user_id: userId,
          filename: objectName,
          original_name: file.originalname,
          mime_type: file.mimetype,
          size: file.size,
        },
      });
      uploadedAttachments.push(attachment);
    }

    return successResponse(res, uploadedAttachments, 'Files uploaded successfully', 201);
  } catch (error: any) {
    console.error('MinIO upload error:', error);
    return errorResponse(res, 'Failed to upload files', 500);
  }
});

export const getAttachments = asyncHandler(async (req: Request, res: Response) => {
  const taskId = parseInt(req.params.id as string);

  const attachments = await prisma.task_attachments.findMany({
    where: { task_id: taskId, deleted_at: null },
    include: {
      users: { select: { id: true, name: true, avatar_url: true } }
    },
    orderBy: { created_at: 'desc' },
  });

  // Attach a temporary pre-signed URL to each attachment
  const attachmentsWithUrls = await Promise.all(
    attachments.map(async (att: any) => {
      try {
        const url = await generatePresignedUrl(att.filename, 3600); // 1 hour expiry
        return { ...att, download_url: url };
      } catch (err) {
        return { ...att, download_url: null };
      }
    })
  );

  return successResponse(res, attachmentsWithUrls, 'Attachments retrieved', 200);
});

export const deleteAttachment = asyncHandler(async (req: Request, res: Response) => {
  const attachmentId = parseInt(req.params.attachmentId as string);
  const userId = (req as any).user.id;
  const userRole = (req as any).user.role;

  const attachment = await prisma.task_attachments.findUnique({
    where: { id: attachmentId },
  });

  if (!attachment || attachment.deleted_at) {
    return errorResponse(res, 'Attachment not found', 404);
  }

  // Only the uploader, an admin, or project manager should delete
  if (attachment.user_id !== userId && userRole !== 'admin' && userRole !== 'manager') {
    return errorResponse(res, 'Unauthorized to delete this attachment', 403);
  }

  // Soft delete in DB
  await prisma.task_attachments.update({
    where: { id: attachmentId },
    data: { deleted_at: new Date() },
  });

  return successResponse(res, null, 'Attachment deleted successfully', 200);
});
