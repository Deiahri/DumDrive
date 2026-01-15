"use client"
import { useAuth } from "@clerk/nextjs";
import { useEffect } from "react";
import { sleep } from "../_tools/tools";

let loaded = false;
/**
 * React hook that appends a user token to the authorization header.
 * @returns 
 */
export default function useAuthedFetch() {
  const { getToken, isLoaded } = useAuth();
  useEffect(() => {
    loaded = isLoaded;
  }, [isLoaded]);

  const AuthedFetch = async (
    input: string | URL | Request,
    init?: RequestInit
  ) => {
    while (!loaded) {
      console.log('waiting till load', loaded);
      await sleep(250);
    }

    const token = await getToken();
    if (!token) {
      throw new Error("Could not get token");
    }

    if (!init) {
      init = {};
    }

    if (!init.headers) {
      init.headers = {};
    }

    init.headers = {
      ...init.headers,
      Authorization: token,
      "Content-Type": "application/json"
    };

    return await fetch(input, init);
  };

  return AuthedFetch;
}
