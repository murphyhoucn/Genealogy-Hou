import { createClient } from '@/lib/supabase/server'
import { Suspense } from 'react'

export default async function Page() {
  const supabase = await createClient()
  const { data: notes } = await supabase.from('notes').select()

  return <Suspense>
    <pre>{JSON.stringify(notes, null, 2)}</pre>
  </Suspense>
}