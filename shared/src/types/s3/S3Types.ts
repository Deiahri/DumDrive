export interface GetDirResponse {
  files: S3File[],
  folders: S3Folder[],
  path: string,
  nextContinuationToken?: string,
  success: boolean
};

export interface S3File {
  name: string,
  lastModified: string, // date string
  size: number,
  isLoading?: boolean
}

export interface S3Folder {
  name: string,
  isLoading?: boolean
};

// export const ForbiddenS3BucketPrefixes = ['s3test'] as const;
// export type ForbiddenS3BucketPrefix = (typeof ForbiddenS3BucketPrefixes[number]);