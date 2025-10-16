// Client-side audio recording utility
export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null
  private audioChunks: Blob[] = []
  private isRecording = false

  async startRecording() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })

      this.mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      })

      this.audioChunks = []

      this.mediaRecorder.addEventListener("dataavailable", (event) => {
        if (event.data.size > 0) {
          this.audioChunks.push(event.data)
        }
      })

      this.mediaRecorder.start()
      this.isRecording = true

      return () => this.stopRecording()
    } catch (error) {
      console.error("[v0] Error starting recording:", error)
      throw error
    }
  }

  async stopRecording(): Promise<Blob> {
    return new Promise((resolve, reject) => {
      if (!this.mediaRecorder || !this.isRecording) {
        reject(new Error("Not recording"))
        return
      }

      this.mediaRecorder.addEventListener("stop", () => {
        const audioBlob = new Blob(this.audioChunks, { type: "audio/webm" })
        this.audioChunks = []

        // Stop all tracks
        if (this.mediaRecorder?.stream) {
          this.mediaRecorder.stream.getTracks().forEach((track) => track.stop())
        }

        this.mediaRecorder = null
        this.isRecording = false

        resolve(audioBlob)
      })

      this.mediaRecorder.stop()
    })
  }

  getIsRecording() {
    return this.isRecording
  }
}

// Send audio to server for transcription
export async function transcribeAudio(audioBlob: Blob): Promise<string> {
  const formData = new FormData()
  formData.append("audio", audioBlob)

  const response = await fetch("/api/transcribe", {
    method: "POST",
    body: formData,
  })

  if (!response.ok) {
    throw new Error("Transcription failed")
  }

  const data = await response.json()
  return data.transcript
}
