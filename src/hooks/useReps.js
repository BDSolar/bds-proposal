import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'

export function useReps() {
  const [reps, setReps] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    supabase
      .from('reps')
      .select('id, name, photo_url, title, bio, stat_text')
      .eq('active', true)
      .order('name')
      .then(({ data, error }) => {
        if (error) setError(error.message)
        else setReps(data)
        setLoading(false)
      })
  }, [])

  return { reps, loading, error }
}
