import { useState, useRef, useCallback } from 'react'

export type VoiceState = 'idle' | 'listening' | 'processing' | 'error'

interface Options {
  onTranscript: (text: string) => void
  onError: (msg: string) => void
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnySpeechRecognition = any

export function useVoiceInput({ onTranscript, onError }: Options) {
  const [state, setState] = useState<VoiceState>('idle')
  const recRef = useRef<AnySpeechRecognition>(null)
  const didGetResultRef = useRef(false)

  const start = useCallback(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SR: AnySpeechRecognition = (window as any).SpeechRecognition ?? (window as any).webkitSpeechRecognition
    if (!SR) {
      onError('Trình duyệt không hỗ trợ voice. Dùng Chrome hoặc Edge.')
      setState('error')
      return
    }

    const rec = new SR()
    rec.lang = 'vi-VN'
    rec.interimResults = false
    rec.maxAlternatives = 1
    rec.continuous = false

    didGetResultRef.current = false

    rec.onstart = () => setState('listening')

    rec.onresult = (e: AnySpeechRecognition) => {
      didGetResultRef.current = true
      const text = e.results[0][0].transcript
      setState('processing')
      onTranscript(text)
    }

    rec.onerror = (e: AnySpeechRecognition) => {
      // 'aborted' sau khi đã nghe → iOS cắt trước khi có kết quả
      if (e.error === 'aborted') {
        if (!didGetResultRef.current) {
          onError('Không nhận được giọng nói. Thử nói ngay sau khi icon đỏ xuất hiện.')
          setState('error')
        } else {
          setState('idle')
        }
        return
      }
      const msg =
        (e.error === 'not-allowed' || e.error === 'service-not-allowed')
          ? 'Chưa cấp quyền microphone. Vào Settings → Safari → Microphone để bật.' :
        e.error === 'no-speech'   ? 'Không nghe thấy gì. Thử lại nhé.' :
        e.error === 'network'     ? 'Lỗi mạng, thử lại.' :
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
