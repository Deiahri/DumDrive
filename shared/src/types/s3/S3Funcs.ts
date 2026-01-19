import { CrockfordBase32 } from "crockford-base32";

export const getBucketIDFromUserID = (userID: string) => {
  const buffer = Buffer.from(userID, 'utf-8');
  return CrockfordBase32.encode(buffer).toLowerCase();
  // return ConvertToBase32(userID).toLowerCase();
};

export const getUserIDFromBucketID = (bucketID: string) => {
  const buffer = CrockfordBase32.decode(bucketID);
  return Buffer.from(buffer).toString('utf-8');
  // return ExtractFromBase32(bucketID.toUpperCase());
};