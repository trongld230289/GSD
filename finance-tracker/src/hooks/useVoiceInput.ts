import { useState, useRef, useCallback } from 'react'
import { transcribeAudio } from '../api/voice'

export type VoiceState = 'idle' | 'listening' | 'processing' | 'error'

interface Options {
  githubPAT: string
  onTranscript: (text: string) => void
  onError: (msg: string) => void
}

export function useVoiceInput({ githubPAT, onTranscript, onError }: Options) {
  const [state, setState] = useState<VoiceState>('idle')
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])

  const start = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []

      // Chọn mime type phù hợp (iOS Safari chỉ support mp4/aac)
      const mimeType = MediaRecorder.isTypeSupported('audio/webm;codecs=opus')
        ? 'audio/webm;codecs=opus'
        : MediaRecorder.isTypeSupported('audio/mp4')
        ? 'audio/mp4'
        : ''

      const recorder = new MediaRecorder(stream, mimeType ? { mimeType } : undefined)

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data)
      }

      recorder.onstop = async () => {
        // Dừng mic stream
        stream.getTracks().forEach((t) => t.stop())

        const blob = new Blob(chunksRef.current, {
          type: recorder.mimeType || 'audio/mp4',
        })

        if (blob.size < 1000) {
          onError('Không nghe thấy gì. Thử lại nhé.')
          setState('error')
          return
        }

        setState('processing')
        try {
          const transcript = await transcribeAudio(blob, recorder.mimeType, githubPAT)
          onTranscript(transcript)
        } catch (err) {
          onError(err instanceof Error ? err.message : 'Transcribe thất bại')
          setState('error')
        }
      }

      mediaRecorderRef.current = recorder
      recorder.start()
      setState('listening')
    } catch (err) {
      const msg = err instanceof Error && err.name === 'NotAllowedError'
        ? 'Chưa cấp quyền microphone.'
        : 'Không thể bật microphone.'
      onError(msg)
      setState('error')
    }
  }, [githubPAT, onTranscript, onError])

  const stop = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  const reset = useCallback(() => setState('idle'), [])

  return { state, start, stop, reset }
}
