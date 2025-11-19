import { useState, useRef } from "react";
import { api } from "../utils/api";

export const useInterviewSession = () => {
  const [sessionId, setSessionId] = useState(null);
  const [interviewStarted, setInterviewStarted] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(null);
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

  const audioRef = useRef(null);
  const isLoadingNextRef = useRef(false);

  const startInterview = async (selectedTechs, experienceYears) => {
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

      const data = await api.startInterview(reqBody);
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
      const data = await api.getQuestion(sid || sessionId);

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
      const audioBlob = await api.getQuestionAudio(sid || sessionId);
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

  const submitAnswer = async (audioBlob) => {
    setIsProcessing(true);
    setIsPlayingFeedback(false);
    setTranscription("");
    setFeedbackMessage("");

    try {
      const result = await api.submitAnswer(sessionId, audioBlob);

      if (result.transcription) setTranscription(result.transcription);

      const audioUrl = URL.createObjectURL(result.audioBlob);

      if (result.shouldLoadNext) {
        if (result.isComplete) {
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

            if (result.isComplete) {
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
      const data = await api.getSummary(sid);
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

  return {
    sessionId,
    interviewStarted,
    currentQuestion,
    isPlayingQuestion,
    isPlayingFeedback,
    isProcessing,
    transcription,
    interviewCompleted,
    summary,
    feedbackMessage,
    isLoadingSummary,
    isStartingInterview,
    showSummary,
    audioRef,
    startInterview,
    loadQuestion,
    playQuestionAudio,
    submitAnswer,
    resetInterview,
    setShowSummary,
  };
};