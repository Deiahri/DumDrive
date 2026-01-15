import { useRouter, useSearchParams } from "next/navigation"

export default function useCustomSearchParams() {
  const router = useRouter()
  const params = useSearchParams()

  const updateParams = (params: Object, replace: boolean) => {
    const currentParams = new URLSearchParams(params.toString())
    for (const [key, val] of Object.entries(params)) {
      currentParams.set(key, val);
    }

    const args: [string] = [`?${currentParams.toString()}`];
    if (replace) {
      router.replace(...args);
    } else {
      router.push(...args);
    }
  }
  
  const getParams = (param: string) => {
    if (!params) return undefined;
    return params.get(param) || undefined;
  }
  return {getParams, updateParams};
}