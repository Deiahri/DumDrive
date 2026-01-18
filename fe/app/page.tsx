import { SignInButton, SignUpButton } from "@clerk/nextjs";
import styles from "./page.module.css";

export default function Home() {
  const login = async () => {};

  return (
    <div className={styles.page}>
      <main className={styles.main}>
        <span style={{ fontSize: "3rem", textAlign: "center" }}>DumDrive</span>
        <div className={styles.ctas}>
          <SignInButton forceRedirectUrl={"/app/initialize"}>
            <a
              className={styles.primary}
              href="https://vercel.com/new?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
            >
              Login
            </a>
          </SignInButton>
          <SignUpButton forceRedirectUrl={"/app/initialize"}>
            <a
              href="https://nextjs.org/docs?utm_source=create-next-app&utm_medium=appdir-template&utm_campaign=create-next-app"
              target="_blank"
              rel="noopener noreferrer"
              className={styles.secondary}
            >
              Sign-up
            </a>
          </SignUpButton>
        </div>
      </main>
    </div>
  );
}
