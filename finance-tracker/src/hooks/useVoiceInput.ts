import { useState, useRef, useCallback } from 'react'

export type VoiceState = 'idle' | 'listening' | 'processing' | 'error'

interface Options {
  onTranscript: (text: string) => void
  onError: (msg: string) => void
}

export function useVoiceInput({ onTranscript, onError }: Options) {
  const [state, setState] = useState<VoiceState>('idle')
  const recRef = useRef<InstanceType<typeof SpeechRecognition> | null>(null)

  const start = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR: typeof SpeechRecognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR) {
      onError('Trình duyệt không hỗ trợ voice. Dùng Chrome hoặc Edge.')
      setState('error')
      return
    }

    const rec = new SR()
    rec.lang = 'vi-VN'
    rec.interimResults = false
    rec.maxAlternatives = 1

    rec.onstart = () => setState('listening')

    rec.onresult = (e) => {
      const text = e.results[0][0].transcript
      setState('processing')
      onTranscript(text)
    }

    rec.onerror = (e) => {
      const msg =
        e.error === 'not-allowed' ? 'Chưa cấp quyền microphone.' :
        e.error === 'no-speech'   ? 'Không nghe thấy gì.' :
        `Lỗi: ${e.error}`
      onError(msg)
      setState('error')
    }

    rec.onend = () => {
      setState((s) => (s === 'listening' ? 'idle' : s))
    }

    recRef.current = rec
    rec.start()
  }, [onTranscript, onError])

  const stop = useCallback(() => {
    recRef.current?.stop()
    setState('idle')
  }, [])

  const reset = useCallback(() => setState('idle'), [])

  return { state, start, stop, reset }
}
