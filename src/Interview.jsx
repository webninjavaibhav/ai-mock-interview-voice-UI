import React, { useState, useRef, useEffect } from "react";
import {
  Mic,
  Play,
  Square,
  Volume2,
  Loader2,
  Briefcase,
  Plus,
  X,
} from "lucide-react";

export default function MockInterviewApp() {
  const [sessionId, setSessionId] = useState(null);

  // Multi-tech system
  const [availableTopics, setAvailableTopics] = useState([]);
  const [selectedTechs, setSelectedTechs] = useState([]);
  const [multiTopicError, setMultiTopicError] = useState("");

  const [experienceYears, setExperienceYears] = useState(0);

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

  // Load available technologies
  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL}/topics`);
      const data = await response.json();
      setAvailableTopics(data.topics);
    } catch (error) {
      console.error("Error loading topics:", error);
      setAvailableTopics(["React", "JavaScript", "Node.js", "TypeScript", "Python"]);
    }
  };

  // Select multiple technologies
  const handleAddTech = (tech) => {
    if (!tech) return;
    if (selectedTechs.find((t) => t.tech === tech)) return;

    setSelectedTechs((s) => [
      ...s,
      {
        tech,
        subtopics: [],
        questions: 1,
        open: true,
      },
    ]);
  };

  const handleRemoveTech = (tech) => {
    setSelectedTechs((s) => s.filter((t) => t.tech !== tech));
  };

  const toggleTechOpen = (tech) => {
    setSelectedTechs((s) =>
      s.map((t) => (t.tech === tech ? { ...t, open: !t.open } : t))
    );
  };

  const addSubtopic = (tech, newTopic) => {
    if (!newTopic || !newTopic.trim()) return;

    setSelectedTechs((s) =>
      s.map((t) =>
        t.tech === tech
          ? {
              ...t,
              subtopics: t.subtopics.includes(newTopic)
                ? t.subtopics
                : [...t.subtopics, newTopic],
            }
          : t
      )
    );

    const el = document.getElementById(`sub_${tech}`);
    if (el) el.value = "";
  };

  const removeSubtopic = (tech, sub) => {
    setSelectedTechs((s) =>
      s.map((t) =>
        t.tech === tech ? { ...t, subtopics: t.subtopics.filter((ss) => ss !== sub) } : t
      )
    );
  };

  const updateQuestions = (tech, value) => {
    setSelectedTechs((s) =>
      s.map((t) => (t.tech === tech ? { ...t, questions: value } : t))
    );
  };

  const getTotalQuestions = () => {
    return selectedTechs.reduce((sum, t) => sum + t.questions, 0);
  };

  // Start interview
  const startInterview = async () => {
    if (selectedTechs.length === 0) {
      setMultiTopicError("Please select at least one technology.");
      return;
    }

    setMultiTopicError("");
    setIsStartingInterview(true);

    try {
      const reqBody = {
        experience_years: experienceYears,
        topics: selectedTechs.map((t) => ({
          tech: t.tech,
          subtopics: t.subtopics,
          questions: t.questions,
        })),
      };

      const response = await fetch(
        `${process.env.REACT_APP_API_URL}/interview/start`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(reqBody),
        }
      );

      if (!response.ok) throw new Error("Failed to start interview");

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

  // Load question
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
// Start screen
if (!interviewStarted) {
  const totalQuestions = getTotalQuestions();
  const containerWidth = selectedTechs.length > 1 ? "max-w-5xl" : "max-w-2xl";
  const availableToAdd = availableTopics.filter(
    (t) => !selectedTechs.find((st) => st.tech === t)
  );
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 w-full to-indigo-50 flex items-center justify-center p-4">
      <div className={`bg-white w-full rounded-xl shadow-lg p-6  w-full space-y-4 border border-gray-100`}>
       {/* {selectedTechs.length > 0 &&  (<div className="text-center mb-4">
          <h1 className="text-3xl font-bold text-gray-900">AI Mock Interview</h1>
          <p className="text-gray-600 mt-1">Select technologies and configure topics</p>
        </div>)} */}

        {/* First Row: Two columns */}
        <div className="grid grid-cols-[1fr_2fr] w-full gap-4">
          {/* Left Column: Multi select tech */}
          <div>
            <label className="text-sm font-semibold text-gray-800 mb-2 block">
              Select Technologies
            </label>

            {/* Multi-select checkbox grid */}
            <div className="border border-gray-200 rounded-lg p-3 bg-gradient-to-br from-gray-50 to-slate-50 max-h-[calc(100dvh_-_240px)] overflow-y-auto">
              <div className="grid grid-cols-1 gap-2">
                {availableTopics.map((tech) => {
                  const isSelected = selectedTechs.find((t) => t.tech === tech);
                  return (
                    <label
                      key={tech}
                      className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer transition-all ${
                        isSelected
                          ? "bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-400 text-indigo-900"
                          : "bg-white border border-gray-200 text-gray-700 hover:border-indigo-200 hover:bg-indigo-50/30"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={!!isSelected}
                        onChange={() => {
                          if (isSelected) {
                            handleRemoveTech(tech);
                          } else {
                            handleAddTech(tech);
                          }
                        }}
                        className="w-4 h-4 text-indigo-600 rounded focus:ring-2 focus:ring-indigo-500 focus:ring-offset-0"
                      />
                      <span className="text-sm font-medium">{tech}</span>
                    </label>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Selected chips and configs */}
          <div className="max-h-[calc(100dvh_-_240px)] flex flex-col overflow-auto">
            {selectedTechs.length > 0 ? (
              <>
                <label className="text-sm font-semibold text-gray-800 mb-2 block">
                  Click to configure:
                </label>
                {/* <div className="flex flex-wrap gap-2 mb-3">
                  {selectedTechs.map((t) => (
                    <div
                      key={t.tech}
                      className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white px-3 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
                      onClick={() => toggleTechOpen(t.tech)}
                    >
                      <span className="text-sm font-medium">{t.tech}</span>
                      {t.open ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  ))}
                </div> */}
              </>
            ): <div className="text-center m-auto h-auto w-fit">
            <h1 className="text-4xl font-bold text-gray-900">AI Mock Interview</h1>
            <p className="text-gray-600 text-lg mt-1">Select technologies and configure topics</p>
          </div>}

            {/* Expanded tech config */}
            <div className={selectedTechs.filter(t => t.open).length > 1 ? "grid grid-cols-1 gap-3" : ""}>
              {selectedTechs.map((t) =>
                t.open ? (
                  <div
                    key={t.tech}
                    className="p-3 bg-gradient-to-br from-slate-50 to-gray-50 border border-gray-200 rounded-lg space-y-3"
                  >

                    <div
                      key={t.tech}
                      className="bg-gradient-to-br w-fit from-indigo-500 to-indigo-600 text-white px-4.5 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md"
                      // onClick={() => toggleTechOpen(t.tech)}
                    >
                      <span className="text-sm text-white">{t.tech}</span>
                      
                      {/* {t.open ? <ChevronUp size={14} /> : <ChevronDown size={14} />} */}
                    </div>
              
                    {/* <h3 className="font-semibold text-sm text-gray-900">{t.tech} Settings</h3> */}

                    {/* Subtopics */}
                    <div>
                      <label className="text-xs text-gray-700 font-medium">Add Subtopic (Optional)</label>
                    <div className="flex gap-6 items-center mt-1.5">
                      <div className="flex gap-2 flex-1">
                        <input
                          type="text"
                          id={`sub_${t.tech}`}
                          placeholder="e.g. Hooks"
                          className="flex-1 border border-gray-300 px-3.5 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm text-gray-900"
                          onKeyPress={(e) => {
                            if (e.key === 'Enter') {
                              e.preventDefault();
                              addSubtopic(
                                t.tech,
                                document.getElementById(`sub_${t.tech}`).value
                              );
                            }
                          }}
                        />
                        <button
                          onClick={() =>
                            addSubtopic(
                              t.tech,
                              document.getElementById(`sub_${t.tech}`).value
                            )
                          }
                          className="bg-indigo-600 text-white px-3 py-2.5 rounded-lg hover:bg-indigo-700 transition flex items-center justify-center shadow-lg"
                        >
                          <Plus size={22} />
                        </button>
                      {/* Question count */}
                      </div>
                      <div className="flex-1">
                      <label className="text-xs text-gray-700 font-medium">
                        Questions: <span className="text-indigo-600 font-semibold">{t.questions}</span>
                      </label>
                      <input
                        type="range"
                        min="1"
                        max="15"
                        value={t.questions}
                        onChange={(e) =>
                          updateQuestions(t.tech, parseInt(e.target.value))
                        }
                        className="w-full mt-1.5"
                      />
                      </div>
                   </div>

                      {/* Subtopic chips */}
                      {t.subtopics.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-2">
                          {t.subtopics.map((s) => (
                            <span
                              key={s}
                              className="bg-white border border-indigo-200 text-indigo-900 px-2.5 py-1 rounded-lg flex items-center gap-1.5 text-xs shadow-sm hover:shadow transition"
                            >
                              {s}
                              <X
                                size={12}
                                className="cursor-pointer hover:text-red-600 transition"
                                onClick={() => removeSubtopic(t.tech, s)}
                              />
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

               
                  </div>
                ) : null
              )}
            </div>
          </div>
        </div>

        {/* Experience */}

        {/* Second Row: Total Questions and Button */}
        <div className="grid grid-cols-[1fr_2fr] items-center justify-between w-full gap-4 items-center pt-2">
        <div>
          <label className="block text-sm font-semibold text-gray-800 mb-2 flex items-center gap-2">
            <Briefcase size={16} className="text-gray-600" /> Experience Level: <span className="text-indigo-600 font-semibold">{getExperienceLevelText(experienceYears)}</span>
          </label>
          <input
            type="range"
            min="0"
            max="10"
            value={experienceYears}
            onChange={(e) => setExperienceYears(parseInt(e.target.value))}
            className="w-full"
          />
        </div>
          {/* Total questions display */}
         <div className="flex justify-end w-full mr-0 ml-auto gap-5">
         {selectedTechs.length > 0 && (
            <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-3 rounded-lg border border-indigo-200">
              <p className="text-lg  text-indigo-900 text-center">
                Total Questions: <span className="text-lg font-semibold">{totalQuestions}</span>
              </p>
            </div>
          )}

          {selectedTechs.length === 0 && <div></div>}

          {/* Start button */}
          <button
            onClick={startInterview}
            disabled={isStartingInterview || selectedTechs.length === 0}
            className="bg-gradient-to-r w-xs h-[54px] from-indigo-600 to-indigo-700 text-white p-3 rounded-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed hover:from-indigo-700 hover:to-indigo-800 transition shadow-sm hover:shadow-md"
          >
            {isStartingInterview ? "Preparing..." : "Start Interview"}
          </button>
         </div>
        </div>

        {/* Errors */}
        {multiTopicError && (
          <p className="text-red-700 text-sm text-center bg-red-50 p-2 rounded-lg border border-red-200">{multiTopicError}</p>
        )}
      </div>
    </div>
  );
}
  // Main question interface
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-indigo-100 to-pink-100 p-4">
      <audio ref={audioRef} className="hidden" />

      <div className="max-w-4xl mx-auto h-full">
        {/* Show summary button when interview is completed */}
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

        {/* Summary display */}
       {/* Summary display */}
       {showSummary && summary && (
          <div className="bg-white rounded-2xl shadow-2xl p-8 mb-6">
            <div className="flex items-center justify-between mb-6 pb-4 border-b">
              <h2 className="text-3xl font-bold text-gray-800">Interview Summary</h2>
              <div className="text-sm text-gray-500">
                {summary.questions_completed} Questions Completed
              </div>
            </div>
            
            <div className="space-y-6">
              {/* Parse and render formatted summary */}
              {summary.summary.split('\n').map((line, index) => {
                // Remove special characters like ** and ##
                const cleanLine = line.replace(/\*\*/g, '').replace(/##/g, '').trim();
                
                if (!cleanLine) return null;
                
                // Check if it's a header (contains ":")
                if (cleanLine.includes(':') && cleanLine.split(':')[1].trim() === '') {
                  return (
                    <h3 key={index} className="text-xl font-semibold text-indigo-700 mt-4">
                      {cleanLine.replace(':', '')}
                    </h3>
                  );
                }
                
                // Check if it's a rating line
                if (cleanLine.toLowerCase().includes('rating') || cleanLine.toLowerCase().includes('/10')) {
                  return (
                    <div key={index} className="bg-indigo-50 p-4 rounded-lg">
                      <p className="text-lg font-semibold text-indigo-900">{cleanLine}</p>
                    </div>
                  );
                }
                
                // Check if it's a bullet point
                if (cleanLine.startsWith('-')) {
                  return (
                    <div key={index} className="flex gap-3 ml-4">
                      <span className="text-indigo-600 mt-1">•</span>
                      <p className="text-gray-700 flex-1">{cleanLine.substring(1).trim()}</p>
                    </div>
                  );
                }
                
                // Regular paragraph
                return (
                  <p key={index} className="text-gray-700 leading-relaxed">
                    {cleanLine}
                  </p>
                );
              })}
            </div>

            <div className="mt-8 pt-6 border-t">
              <div className="flex gap-4">
                <button
                  onClick={resetInterview}
                  className="flex-1 bg-indigo-600 text-white py-3 rounded-lg font-semibold hover:bg-indigo-700 transition"
                >
                  Start New Interview
                </button>
              </div>
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
                  {selectedTechs.length > 0 ? selectedTechs.map(t => t.tech).join(", ") : "General"} • {getExperienceLevelText(experienceYears)}
                </p>
              </div>
              {currentQuestion && (
                <div className="text-right">
                  <p className="text-sm text-gray-600">Question</p>
                  <p className="text-2xl font-bold text-indigo-600">
                    {currentQuestion.question_number} / {currentQuestion.total_questions}
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
                        {isPlayingQuestion ? "Playing question..." : "Playing feedback..."}
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
                        <span className="text-sm font-medium">Recording in progress...</span>
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
                    disabled={isPlayingQuestion || isRecording || isProcessing || isPlayingFeedback}
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