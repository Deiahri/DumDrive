import { useRouter, useSearchParams } from "next/navigation";

export default function useCustomSearchParams() {
  const router = useRouter();
  const params = useSearchParams();

  const updateParams = (newParams: Object, replace: boolean) => {
    const currentParams = new URLSearchParams(
      newParams as Record<string, string>,
    );

    // adds existing ones too
    for (const [key, val] of params.entries()) {
      currentParams.set(key, val);
    }

    for (const [key, val] of Object.entries(newParams)) {
      currentParams.set(key, val);
    }

    const args: [string] = [`?${currentParams.toString()}`];
    console.log("updateParams", args, newParams);
    if (replace) {
      router.replace(...args);
    } else {
      router.push(...args);
    }
  };

  const getParams = (param: string) => {
    if (!params) return undefined;
    return params.get(param) || undefined;
  };
  return { getParams, updateParams };
}
