'use client'

import { useEffect, useState } from 'react'
import { ResultCard } from './ResultCard'
import { getThumbs } from '@/lib/thumbstore'
import type { ScanResponse } from '@/types'

/**
 * Client wrapper that pulls the captured-photo thumbnail out of sessionStorage
 * and hands it to the (server-renderable) ResultCard. Reads after mount so the
 * server HTML (no thumbnail) always matches the first client render, then the
 * photo fades in without a hydration mismatch.
 */
export function ResultCardWithThumb({ scan, id }: { scan: ScanResponse; id: string }) {
  const [thumbnail, setThumbnail] = useState<string | null>(null)

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setThumbnail(getThumbs()[id])
  }, [id])

  return <ResultCard scan={scan} thumbnail={thumbnail} />
}