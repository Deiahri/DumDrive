import { credential } from "firebase-admin";
import { initializeApp } from "firebase-admin/app";
import { env_vars } from "./env_vars";

initializeApp({
  credential: credential.cert(env_vars.FB_ADMIN_JSON),
});
