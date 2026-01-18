"use client"

import useAuthedFetch from "@/app/_hooks/useAuthedFetch";
import { env_vars } from "@/app/_tools/env_vars";
import { useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect, useRef } from "react";
import { checkGetDirResponse } from '@shared/types/s3/S3Check';

export default function InitializerComp() {
  const router = useRouter();
  const AuthedFetch = useAuthedFetch();
  const user = useUser();

  // console.log(JSON.stringify(user));

  useEffect(() => {
    if (!user.isLoaded) return;
    // return;
    const intitialize = async () => {
      try {
        const res = await (await AuthedFetch(`${env_vars.BACKEND_URL}/Initialize`, {
          method: "POST",
          body: JSON.stringify({
            email: user.user?.emailAddresses[0].emailAddress
          })
        })).json();
        
        if (res.error) {
          console.error(res.error);
          router.replace('/');
        }

        router.replace('/app');
      } catch (e) {
        alert((e as Error).message);
        router.replace('/');
      }
    }
    intitialize();
  }, [user]);

  return <span>Initializing</span>;
}
