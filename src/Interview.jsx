import React, { useState, useRef, useEffect } from "react";
import { Mic, Play, Square, Volume2, Loader2, Briefcase } from "lucide-react";


export default function MockInterviewApp() {
  const [sessionId, setSessionId] = useState(null);
  const [topic, setTopic] = useState("React");
  const [numQuestions, setNumQuestions] = useState(5);
  const [experienceYears, setExperienceYears] = useState(0);
  const [availableTopics, setAvailableTopics] = useState([]);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlayingQuestion, setIsPlayingQuestion] = useState(false);
  const [isPlayingFeedback, setIsPlayingFeedback] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [transcription, setTranscription] = useState("");
  const [interviewCompleted, setInterviewCompleted] = useState(false);
  const [summary, setSummary] = useState(null);
  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isStartingInterview, setIsStartingInterview] = useState(false);
  const [showSummary, setShowSummary] = useState(false);
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const audioRef = useRef(null);
  const isLoadingNextRef = useRef(false);

  // Load available topics on mount
  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/topics`);
      const data = await response.json();
      setAvailableTopics(data.topics);
      if (data.topics.length > 0) {
        setTopic(data.topics[0]);
      }
    } catch (error) {
      console.error("Error loading topics:", error);
      // Fallback topics
      setAvailableTopics(["React", "JavaScript", "Next.js", "Python", "Node.js"]);
    }
  };

  const startInterview = async () => {
    try {
      setIsStartingInterview(true);
      const response = await fetch(`${process.env.REACT_APP_API_URL}/interview/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          topic, 
          num_questions: numQuestions,
          experience_years: experienceYears 
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to start interview");
      }

      const data = await response.json();
      setSessionId(data.session_id);
      setInterviewStarted(true);
      await loadQuestion(data.session_id, true);
    } catch (error) {
      console.error("Error starting interview:", error);
      alert("Failed to start interview. Make sure the backend is running.");
    } finally {
      setIsStartingInterview(false);
    }
  };

  const loadQuestion = async (sid, shouldAutoPlay = false) => {
    if (isLoadingNextRef.current) return;
    isLoadingNextRef.current = true;
    try {
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/interview/${sid || sessionId}/question`
      );
      const data = await response.json();

      if (data.completed) {
        setInterviewCompleted(true);
        await loadSummary(sid || sessionId);
      } else {
        setCurrentQuestion(data);
        setTranscription("");
        setFeedbackMessage("");
        if (shouldAutoPlay) await playQuestionAudio(sid || sessionId);
      }
    } catch (error) {
      console.error("Error loading question:", error);
    } finally {
      isLoadingNextRef.current = false;
    }
  };

  const playQuestionAudio = async (sid) => {
    try {
      setIsPlayingQuestion(true);
      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/interview/${sid || sessionId}/audio/question`
      );
      const audioBlob = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob);

      if (audioRef.current) {
        audioRef.current.src = audioUrl;
        await audioRef.current.play();
        audioRef.current.onended = () => setIsPlayingQuestion(false);
      }
    } catch (error) {
      console.error("Error playing audio:", error);
      setIsPlayingQuestion(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await submitAnswer(audioBlob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Error starting recording:", error);
      alert("Please allow microphone access to record your answer.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const submitAnswer = async (audioBlob) => {
    setIsProcessing(true);
    setIsPlayingFeedback(false);
    setTranscription("");
    setFeedbackMessage("");

    try {
      const formData = new FormData();
      formData.append("audio", audioBlob, "answer.webm");

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/interview/${sessionId}/answer`,
        {
          method: "POST",
          body: formData,
        }
      );

      const transcriptionText = response.headers.get("X-Transcription");
      const shouldLoadNext = response.headers.get("X-Should-Load-Next");
      const isComplete = response.headers.get("X-Interview-Complete");

      if (transcriptionText) setTranscription(transcriptionText);

      const audioBlob2 = await response.blob();
      const audioUrl = URL.createObjectURL(audioBlob2);

      const movingToNext = shouldLoadNext === "true";
      const interviewComplete = isComplete === "true";

      if (movingToNext) {
        if (interviewComplete) {
          setFeedbackMessage("Interview completed! Preparing summary...");
        } else {
          setFeedbackMessage("Great! Moving to next question...");
        }

        if (audioRef.current) {
          setIsPlayingFeedback(true);
          audioRef.current.src = audioUrl;
          await audioRef.current.play();

          audioRef.current.onended = async () => {
            setIsPlayingFeedback(false);
            setIsProcessing(false);

            if (interviewComplete) {
              setInterviewCompleted(true);
              setIsLoadingSummary(true);
              await loadSummary(sessionId);
            } else {
              setFeedbackMessage("");
              await loadQuestion(sessionId, true);
            }
          };
        }
      } else {
        setFeedbackMessage("Listening to follow-up...");
        if (audioRef.current) {
          setIsPlayingFeedback(true);
          audioRef.current.src = audioUrl;
          await audioRef.current.play();
          audioRef.current.onended = () => {
            setIsPlayingFeedback(false);
            setIsProcessing(false);
            setFeedbackMessage("");
          };
        }
      }
    } catch (error) {
      console.error("Error submitting answer:", error);
      setIsProcessing(false);
      setIsPlayingFeedback(false);
      setFeedbackMessage("Error processing answer. Please try again.");
    }
  };

  const loadSummary = async (sid) => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/interview/${sid}/summary`);
      const data = await response.json();
      setSummary(data);
    } catch (error) {
      console.error("Error loading summary:", error);
    } finally {
      setIsLoadingSummary(false);
    }
  };

  const resetInterview = () => {
    setSessionId(null);
    setInterviewStarted(false);
    setCurrentQuestion(null);
    setInterviewCompleted(false);
    setSummary(null);
    setTranscription("");
    setFeedbackMessage("");
    setIsPlayingFeedback(false);
    setShowSummary(false);
    isLoadingNextRef.current = false;
  };

  const getExperienceLevelText = (years) => {
    if (years === 0) return "Fresher / Entry Level";
    if (years <= 2) return `Junior (${years} ${years === 1 ? 'year' : 'years'})`;
    if (years <= 5) return `Mid-Level (${years} years)`;
    return `Senior (${years}+ years)`;
  };

  // Loading summary screen
  if (isLoadingSummary) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-100 to-pink-50">
        <div className="relative">
          <div className="w-24 h-24 rounded-full border-8 border-indigo-200 border-t-indigo-600 animate-spin"></div>
          <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="w-12 h-12 text-indigo-700 animate-pulse" />
          </div>
        </div>
        <h2 className="mt-8 text-2xl font-semibold text-gray-800 animate-pulse">
          Preparing your interview summary...
        </h2>
        <p className="mt-2 text-gray-600">
          Please wait while we analyze your performance.
        </p>
      </div>
    );
  }

  // Start screen
  if (!interviewStarted) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-indigo-100 rounded-full mb-4">
              <Mic className="w-12 h-12 text-indigo-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              AI Mock Interview
            </h1>
            <p className="text-gray-600">
              Practice your technical interview skills with AI
            </p>
          </div>

          <div className="space-y-6">
            {/* Topic Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Topic
              </label>
              <select
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white"
              >
                {availableTopics.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            {/* Experience Years */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                <Briefcase className="w-4 h-4" />
                Experience Level
              </label>
              <div className="space-y-3">
                <input
                  type="range"
                  min="0"
                  max="10"
                  value={experienceYears}
                  onChange={(e) => setExperienceYears(parseInt(e.target.value))}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-600">
                  <span>Fresher</span>
                  <span>Junior</span>
                  <span>Mid</span>
                  <span>Senior</span>
                </div>
                <div className="text-center">
                  <span className="inline-block px-4 py-2 bg-indigo-50 text-indigo-700 rounded-full font-medium">
                    {getExperienceLevelText(experienceYears)}
                  </span>
                </div>
              </div>
            </div>

            {/* Number of Questions */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Number of Questions: {numQuestions}
              </label>
              <input
                type="range"
                min="1"
                max="10"
                value={numQuestions}
                onChange={(e) => setNumQuestions(parseInt(e.target.value))}
                className="w-full"
              />
              <div className="flex justify-between text-xs text-gray-600 mt-1">
                <span>Quick (3)</span>
                <span>Standard (5-7)</span>
                <span>Comprehensive (10)</span>
              </div>
            </div>

            {/* Start Button */}
            <button
              onClick={startInterview}
              disabled={isStartingInterview}
              className="w-full bg-indigo-600 text-white py-4 rounded-lg font-semibold hover:bg-indigo-700 hover:scale-105 transform transition duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {isStartingInterview ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Generating Questions...
                </>
              ) : (
                "Start Interview"
              )}
            </button>

            <p className="text-xs text-gray-500 text-center mt-4">
              Questions will be dynamically generated based on your selected topic and experience level
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Summary screen
  if (interviewCompleted && summary && showSummary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4 flex items-center justify-center">
        <div className="max-w-3xl w-full bg-white rounded-2xl shadow-2xl p-8">
          <div className="text-center mb-8">
            <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
              <Volume2 className="w-12 h-12 text-green-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Interview Complete!
            </h1>
            <p className="text-gray-600">Here's your performance summary</p>
          </div>

          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <h2 className="text-xl font-semibold text-gray-800 mb-4">
              Summary
            </h2>
            <div className="prose prose-sm max-w-none text-gray-700 whitespace-pre-wrap">
              {summary.summary}
            </div>
          </div>

          <div className="bg-blue-50 rounded-lg p-6 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Interview Details
            </h3>
            <div className="space-y-2 text-sm">
              <p>
                <span className="font-medium">Topic:</span> {summary.topic}
              </p>
              <p>
                <span className="font-medium">Experience Level:</span>{" "}
                {getExperienceLevelText(summary.experience_years)}
              </p>
              <p>
                <span className="font-medium">Questions Completed:</span>{" "}
                {summary.questions_completed}
              </p>
            </div>
          </div>

          <button
            onClick={resetInterview}
            className="w-full bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 hover:scale-105 transform transition duration-200"
          >
            Start New Interview
          </button>
        </div>
      </div>
    );
  }

  // Main question interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-100 to-pink-100 p-4">
      <audio ref={audioRef} className="hidden" />

      <div className="max-w-4xl mx-auto">
        {/* Show Summary Button when interview is completed */}
        {interviewCompleted && summary && !showSummary && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
            <div className="text-center">
              <div className="inline-block p-4 bg-green-100 rounded-full mb-4">
                <Volume2 className="w-12 h-12 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Interview Completed! 🎉
              </h2>
              <p className="text-gray-600 mb-6">
                Great job! Your interview has been completed successfully.
              </p>
              <button
                onClick={() => setShowSummary(true)}
                className="bg-indigo-600 text-white px-8 py-4 rounded-lg font-semibold hover:bg-indigo-700 hover:scale-105 transform transition duration-200 shadow-lg"
              >
                Show My Summary
              </button>
            </div>
          </div>
        )}

        {!interviewCompleted && (
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-800">
                Mock Interview
              </h1>
              <p className="text-gray-600">
                {topic} • {getExperienceLevelText(experienceYears)}
              </p>
            </div>
            {currentQuestion && (
              <div className="text-right">
                <p className="text-sm text-gray-600">Question</p>
                <p className="text-2xl font-bold text-indigo-600">
                  {currentQuestion.question_number} /{" "}
                  {currentQuestion.total_questions}
                </p>
              </div>
            )}
          </div>

          {currentQuestion && (
            <div className="mb-8">
              <div className="bg-indigo-50 rounded-lg p-6 mb-6">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-indigo-100 rounded-full">
                    <Volume2 className="w-6 h-6 text-indigo-600" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-800 mb-2">
                      Current Question:
                    </h2>
                    <p className="text-gray-700">{currentQuestion.question}</p>
                  </div>
                </div>

                {(isPlayingQuestion || isPlayingFeedback) && (
                  <div className="mt-4 flex items-center gap-2 text-indigo-600">
                    <div className="animate-pulse">●</div>
                    <span className="text-sm">
                      {isPlayingQuestion
                        ? "Playing question..."
                        : "Playing feedback..."}
                    </span>
                  </div>
                )}
              </div>

              <div className="bg-gray-50 rounded-lg p-6 mb-6">
                <div className="flex flex-col items-center gap-4">
                  {!isRecording && !isProcessing && !isPlayingFeedback && (
                    <button
                      onClick={startRecording}
                      disabled={isPlayingQuestion}
                      className="flex items-center gap-3 bg-red-500 text-white px-8 py-4 rounded-full font-semibold hover:bg-red-600 hover:scale-105 transform transition duration-200 shadow-lg disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Mic className="w-6 h-6" />
                      Start Recording Answer
                    </button>
                  )}

                  {isRecording && (
                    <button
                      onClick={stopRecording}
                      className="flex items-center gap-3 bg-gray-800 text-white px-8 py-4 rounded-full font-semibold hover:bg-gray-900 hover:scale-105 transform transition duration-200 shadow-lg"
                    >
                      <Square className="w-6 h-6" />
                      Stop Recording
                    </button>
                  )}

                  {isRecording && (
                    <div className="flex items-center gap-2 text-red-500">
                      <div className="w-3 h-3 bg-red-500 rounded-full animate-pulse"></div>
                      <span className="text-sm font-medium">
                        Recording in progress...
                      </span>
                    </div>
                  )}

                  {(isProcessing || isPlayingFeedback) && (
                    <div className="flex flex-col items-center gap-2">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
                      <p className="text-gray-600 text-sm">
                        {feedbackMessage || "Processing your answer..."}
                      </p>
                    </div>
                  )}
                </div>

                {transcription && (
                  <div className="mt-6 p-4 bg-white rounded-lg border border-gray-200">
                    <p className="text-xs text-gray-500 mb-2">
                      Your answer (transcribed):
                    </p>
                    <p className="text-gray-700 italic">"{transcription}"</p>
                  </div>
                )}

                {feedbackMessage && !isProcessing && !isPlayingFeedback && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <p className="text-sm text-blue-700">{feedbackMessage}</p>
                  </div>
                )}
              </div>

              <div className="flex gap-4">
                <button
                  onClick={() => playQuestionAudio(sessionId)}
                  disabled={
                    isPlayingQuestion ||
                    isRecording ||
                    isProcessing ||
                    isPlayingFeedback
                  }
                  className="flex-1 flex items-center justify-center gap-2 bg-indigo-100 text-indigo-700 py-3 rounded-lg font-medium hover:bg-indigo-200 hover:scale-105 transform transition duration-200 disabled:opacity-50"
                >
                  <Play className="w-5 h-5" />
                  Replay Question
                </button>
                <button
                  onClick={resetInterview}
                  className="px-6 py-3 bg-gray-200 text-gray-700 rounded-lg font-medium hover:bg-gray-300 hover:scale-105 transform transition duration-200"
                >
                  Exit
                </button>
              </div>
            </div>
          )}
        </div>
        )}
      </div>
    </div>
  );
}