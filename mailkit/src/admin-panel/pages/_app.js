import '../styles/globals.css'
import { SessionProvider, useSession } from "next-auth/react"
import { useEffect } from 'react';

function MyApp({ Component, pageProps: { session, ...pageProps } }) {
  return (
    <SessionProvider session={session}>
      {Component.auth ? (
        <Auth>
          <Component {...pageProps} />
        </Auth>
      ) : (
        <Component {...pageProps} />
      )}
    </SessionProvider>
  )
}

function Auth({ children }) {
  const { data: session, status } = useSession({ required: true });
  const isUser = !!session?.user;

  useEffect(() => {
    // This effect will run when the session status changes.
    // If the status is "loading", it means we're waiting for the session to be verified.
    // If the status is "unauthenticated", the user will be redirected by the session provider.
  }, [status]);

  if (isUser) {
    return children;
  }

  // Session is being fetched, or redirection is happening.
  // Show a loading indicator.
  return <div>Loading...</div>;
}

export default MyApp
