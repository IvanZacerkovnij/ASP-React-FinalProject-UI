import { useCallback } from 'react'
import { useMutation, useQueryClient, type QueryClient } from '@tanstack/react-query'
import { api } from './client'

export function errorMessage(error: unknown, fallback = 'Не вдалося виконати запит.'): string {
  return error instanceof Error ? error.message : fallback
}

export function useServerMutation<Input, Output>(run: (input: Input) => Promise<Output>, changed: string[]) {
  const client = useQueryClient()
  const mutation = useMutation({
    mutationFn: run,
    onMutate: () => ({ generation: api.getSessionId() }),
    onSuccess: async (_data, _input, context) => {
      const generation = api.getSessionId()
      if (generation !== context?.generation) return
      await Promise.all(changed.map(domain => client.invalidateQueries({ queryKey: [domain] })))
    },
  })
  const { mutateAsync } = mutation
  const trigger = useCallback((input: Input) => {
    const promise = mutateAsync(input)
    return Object.assign(promise, { unwrap: () => promise })
  }, [mutateAsync])
  return [trigger, { ...mutation, isLoading: mutation.isPending }] as const
}

export async function invalidateSocial(client: QueryClient) {
  await Promise.all(['content', 'profiles', 'discovery', 'moderation'].map(domain =>
    client.invalidateQueries({ queryKey: [domain] }),
  ))
}
