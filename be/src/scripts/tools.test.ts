import { describe, it, expect } from "vitest";
import { sleep, ConvertToBase32, ExtractFromBase32 } from "./tools";

describe("tools.ts", () => {
  describe("sleep", () => {
    it("should delay execution for the specified time", async () => {
      const start = Date.now();
      const delay = 100;
      const threshold = 10;
      await sleep(delay);
      const end = Date.now();
      
      const diff = end - start;
      // delay +- threshold is acceptable threshold
      expect(diff).toBeGreaterThanOrEqual(delay - threshold); 
      expect(diff).toBeLessThanOrEqual(delay + threshold); 
    });
  });

  describe("ConvertToBase32", () => {
    it("should convert a string to Crockford Base32 format", () => {
      const input = "testString";
      const result = ConvertToBase32(input);
      expect(result).toBeDefined();
      expect(typeof result).toBe("string");
    });

    it("should produce consistent results for the same input", () => {
      const input = "consistentTest";
      const result1 = ConvertToBase32(input);
      const result2 = ConvertToBase32(input);
      expect(result1).toBe(result2);
    });
  });

  describe("ExtractFromBase32", () => {
    it("should decode a Crockford Base32 string back to the original string", () => {
      const input = "testString";
      const encoded = ConvertToBase32(input);
      const decoded = ExtractFromBase32(encoded);
      expect(decoded).toBe(input);
    });

    it("should throw an error for invalid Base32 strings", () => {
      const invalidBase32 = "Test-bucket-created"; // fails because of U.
      expect(() => ExtractFromBase32(invalidBase32)).toThrow();
    });
  });
});


