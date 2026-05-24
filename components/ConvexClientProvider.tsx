'use client'

import { ReactNode, useCallback } from 'react'
import { ConvexReactClient } from 'convex/react'
import { ConvexProviderWithClerk } from 'convex/react-clerk'
import { useAuth } from '@clerk/nextjs'

const convex = new ConvexReactClient(process.env.NEXT_PUBLIC_CONVEX_URL!)

function useAuthForConvex() {
  const { getToken, ...rest } = useAuth()

  return {
    ...rest,
    getToken: useCallback(
      (options?: { template?: string; skipCache?: boolean }) =>
        getToken({ ...options, template: 'convex' }),
      [getToken],
    ),
  }
}

export default function ConvexClientProvider({ children }: { children: ReactNode }) {
  return (
    <ConvexProviderWithClerk client={convex} useAuth={useAuthForConvex}>
      {children}
    </ConvexProviderWithClerk>
  )
}