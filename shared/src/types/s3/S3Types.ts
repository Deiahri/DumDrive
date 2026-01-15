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
  size: number 
}

export interface S3Folder {
  name: string
};