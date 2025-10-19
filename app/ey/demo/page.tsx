"use client"

import { useState, useEffect, useRef } from "react"
import { useRouter } from "next/navigation"
import { Mic, MicOff, Volume2, VolumeX, Settings, LogOut } from "lucide-react"

export default function EYDemoPage() {
  const router = useRouter()
  const [user, setUser] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isRecording, setIsRecording] = useState(false)
  const [isSpeaking, setIsSpeaking] = useState(false)
  const [transcript, setTranscript] = useState("")
  const [response, setResponse] = useState("")
  const [benchmarks, setBenchmarks] = useState<any[]>([])
  const [showSettings, setShowSettings] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  useEffect(() => {
    // Check authentication
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then((data) => {
        if (!data.authenticated) {
          router.push("/login?returnTo=/ey/demo")
        } else if (data.user.role !== "ey_tester" && data.user.role !== "admin") {
          router.push("/unauthorized")
        } else {
          setUser(data.user)
          setLoading(false)
        }
      })
      .catch(() => {
        router.push("/login")
      })
  }, [router])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/login")
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: "audio/webm" })
        await processAudio(audioBlob)
        stream.getTracks().forEach((track) => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (error) {
      console.error("Error starting recording:", error)
      alert("Could not access microphone. Please check permissions.")
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
    }
  }

  const processAudio = async (audioBlob: Blob) => {
    try {
      const startTime = Date.now()

      // Send audio to transcription API
      const formData = new FormData()
      formData.append("audio", audioBlob)

      const transcriptResponse = await fetch("/api/voice/transcribe", {
        method: "POST",
        body: formData,
      })

      const transcriptData = await transcriptResponse.json()
      const transcriptText = transcriptData.transcript || ""
      setTranscript(transcriptText)

      // Send to LLM for processing
      const llmResponse = await fetch("/api/voice/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          transcript: transcriptText,
          model: "gpt-oss:120b-cloud",
        }),
      })

      const llmData = await llmResponse.json()
      const responseText = llmData.response || ""
      setResponse(responseText)

      const endTime = Date.now()
      const latency = endTime - startTime

      // Save benchmark data
      saveBenchmark({
        model: "gpt-oss:120b-cloud",
        latency,
        tokensInput: transcriptText.split(" ").length,
        tokensOutput: responseText.split(" ").length,
      })

      // Speak the response
      speakText(responseText)
    } catch (error) {
      console.error("Error processing audio:", error)
      alert("Error processing audio. Please try again.")
    }
  }

  const speakText = (text: string) => {
    if ("speechSynthesis" in window) {
      setIsSpeaking(true)
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.onend = () => {
        setIsSpeaking(false)
        // Automatically start recording again for continuous loop
        setTimeout(() => {
          startRecording()
        }, 500) // Small delay to ensure clean transition
      }
      window.speechSynthesis.speak(utterance)
    }
  }

  const stopSpeaking = () => {
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel()
      setIsSpeaking(false)
    }
  }

  const saveBenchmark = async (data: any) => {
    try {
      await fetch("/api/benchmarks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      })
      loadBenchmarks()
    } catch (error) {
      console.error("Error saving benchmark:", error)
    }
  }

  const loadBenchmarks = async () => {
    try {
      const response = await fetch("/api/benchmarks")
      const data = await response.json()
      setBenchmarks(data.benchmarks || [])
    } catch (error) {
      console.error("Error loading benchmarks:", error)
    }
  }

  useEffect(() => {
    if (user) {
      loadBenchmarks()
    }
  }, [user])

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-zinc-600 dark:text-zinc-400">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Header */}
      <header className="bg-white dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-50">
              HyperFocus Voice Agent Demo
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              EY Exclusive Access • {user?.email}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowSettings(!showSettings)}
              className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white"
            >
              <LogOut className="w-4 h-4" />
              Logout
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Voice Agent Interface */}
          <div className="lg:col-span-2">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-8">
              <h2 className="text-xl font-semibold mb-6">Voice Agent Interface</h2>

              <div className="flex flex-col items-center justify-center py-12">
                <button
                  onClick={isRecording ? stopRecording : startRecording}
                  className={`w-32 h-32 rounded-full flex items-center justify-center transition-all ${
                    isRecording
                      ? "bg-red-600 hover:bg-red-700 animate-pulse"
                      : "bg-blue-600 hover:bg-blue-700"
                  }`}
                >
                  {isRecording ? (
                    <MicOff className="w-16 h-16 text-white" />
                  ) : (
                    <Mic className="w-16 h-16 text-white" />
                  )}
                </button>

                <p className="mt-6 text-zinc-600 dark:text-zinc-400">
                  {isRecording ? "Recording... Click to stop" : "Click to start recording"}
                </p>

                {isSpeaking && (
                  <button
                    onClick={stopSpeaking}
                    className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-600 hover:bg-orange-700 text-white"
                  >
                    <VolumeX className="w-4 h-4" />
                    Stop Speaking
                  </button>
                )}
              </div>

              {transcript && (
                <div className="mt-8 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <h3 className="text-sm font-semibold text-blue-900 dark:text-blue-100 mb-2">
                    Your Input:
                  </h3>
                  <p className="text-sm text-blue-800 dark:text-blue-200">{transcript}</p>
                </div>
              )}

              {response && (
                <div className="mt-4 p-4 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="text-sm font-semibold text-green-900 dark:text-green-100 mb-2">
                        AI Response:
                      </h3>
                      <p className="text-sm text-green-800 dark:text-green-200">{response}</p>
                    </div>
                    <button
                      onClick={() => speakText(response)}
                      className="ml-4 p-2 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40"
                    >
                      <Volume2 className="w-5 h-5 text-green-700 dark:text-green-300" />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Benchmarks & Metrics */}
          <div className="space-y-6">
            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-lg font-semibold mb-4">Performance Metrics</h3>

              <div className="space-y-4">
                {benchmarks.slice(0, 5).map((benchmark, index) => (
                  <div
                    key={index}
                    className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                  >
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
                        {benchmark.model}
                      </span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          benchmark.latency < 2000
                            ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300"
                            : "bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300"
                        }`}
                      >
                        {benchmark.latency}ms
                      </span>
                    </div>
                    <div className="text-xs text-zinc-500 dark:text-zinc-400">
                      Tokens: {benchmark.tokensInput} in / {benchmark.tokensOutput} out
                    </div>
                  </div>
                ))}
              </div>

              {benchmarks.length === 0 && (
                <p className="text-sm text-zinc-500 dark:text-zinc-400 text-center py-4">
                  No benchmarks yet. Start using the voice agent!
                </p>
              )}
            </div>

            <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
              <h3 className="text-lg font-semibold mb-4">System Status</h3>

              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Voice Agent</span>
                  <span className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                    Healthy
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">LLM Service</span>
                  <span className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                    Healthy
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-zinc-600 dark:text-zinc-400">Database</span>
                  <span className="text-xs px-2 py-1 rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                    Healthy
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
