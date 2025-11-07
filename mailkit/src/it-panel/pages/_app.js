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
    // Logic to handle session status can be placed here.
  }, [status]);

  if (isUser) {
    return children;
  }

  return <div>Loading...</div>;
}

export default MyApp
