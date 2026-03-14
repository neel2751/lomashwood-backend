import { randomUUID } from "node:crypto";

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { NextResponse } from "next/server";
import { z } from "zod";

import { createMediaAsset } from "@servers/media.actions";

const requestSchema = z.object({
  filename: z.string().min(1),
  contentType: z.string().min(1),
  folder: z.string().trim().min(1).default("showrooms"),
  source: z.string().trim().min(1).optional(),
});

function requiredEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured`);
  }
  return value;
}

function buildFileUrl(bucket: string, region: string, key: string): string {
  const configuredBase =
    process.env.STORAGE_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_CDN_URL || "";

  const isLocalhostBase = /^https?:\/\/localhost(?::\d+)?\/?$/i.test(configuredBase.trim());
  const base =
    configuredBase && !isLocalhostBase
      ? configuredBase
      : `https://${bucket}.s3.${region}.amazonaws.com`;

  return `${base.replace(/\/$/, "")}/${key}`;
}

export async function POST(req: Request) {
  try {
    const body = requestSchema.parse(await req.json());

    const region = requiredEnv("STORAGE_REGION");
    const bucket = requiredEnv("STORAGE_BUCKET");
    const accessKeyId = requiredEnv("STORAGE_ACCESS_KEY_ID");
    const secretAccessKey = requiredEnv("STORAGE_SECRET_ACCESS_KEY");

    const safeFolder = body.folder.replace(/[^a-zA-Z0-9/_-]/g, "").replace(/^\/+|\/+$/g, "");
    const normalizedFolder = safeFolder.startsWith("public/") ? safeFolder : `public/${safeFolder}`;
    const extension = body.filename.includes(".") ? body.filename.split(".").pop() : "bin";
    const key = `${normalizedFolder}/${Date.now()}-${randomUUID()}.${extension}`;

    const client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    const command = new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      ContentType: body.contentType,
    });

    const uploadUrl = await getSignedUrl(client, command, { expiresIn: 300 });
    const fileUrl = buildFileUrl(bucket, region, key);

    const media = await createMediaAsset({
      key,
      url: fileUrl,
      fileName: body.filename,
      mimeType: body.contentType,
      folder: normalizedFolder,
      source: body.source ?? "direct-upload",
      status: "untouched",
    });

    return NextResponse.json({ uploadUrl, fileUrl, key, mediaId: media.id }, { status: 200 });
  } catch (error: any) {
    const message = error?.message || "Failed to generate upload URL";
    return NextResponse.json({ message }, { status: 400 });
  }
}
