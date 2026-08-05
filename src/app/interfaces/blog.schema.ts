import { z } from 'zod';

const blogBaseSchema = z.object({
  id: z.number(),
  title: z.string(),
  author: z.string(),
  likes: z.number(),
  likedByMe: z.boolean(),
  createdByMe: z.boolean(),
  headerImageUrl: z.string().optional(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const blogCommentSchema = z.object({
  id: z.number(),
  author: z.string(),
  content: z.string(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

export const blogSchema = blogBaseSchema.extend({
  contentPreview: z.string(),
  comments: z.number(),
});

export const blogDetailSchema = blogBaseSchema.extend({
  content: z.string(),
  comments: z.array(blogCommentSchema),
});

export const blogListResponseSchema = z.object({
  data: z.array(blogSchema),
  pageIndex: z.number(),
  pageSize: z.number(),
  maxPageSize: z.number(),
  totalCount: z.number(),
});

export type Blog = z.infer<typeof blogSchema>;
export type BlogDetail = z.infer<typeof blogDetailSchema>;
export type BlogComment = z.infer<typeof blogCommentSchema>;
