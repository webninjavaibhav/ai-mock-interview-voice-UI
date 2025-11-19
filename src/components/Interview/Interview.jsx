import React, { useState } from "react";
import { StartConfig } from "./StartConfig";
import { InterviewSession } from "./InterviewSession";
import { useInterviewSession } from "../../hooks/useInterviewSession";

export default function Interview() {
  const [selectedTechs, setSelectedTechs] = useState([]);
  const [experienceYears, setExperienceYears] = useState(0);

  const {
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
    showSummary,
    audioRef,
    startInterview,
    playQuestionAudio,
    submitAnswer,
    resetInterview,
    setShowSummary,
  } = useInterviewSession();

  const handleStart = async (techs, years) => {
    setSelectedTechs(techs);
    setExperienceYears(years);
    await startInterview(techs, years);
  };

  if (!interviewStarted) {
    return <StartConfig onStart={handleStart} />;
  }

  return (
    <>
      <audio ref={audioRef} className="hidden" />
      <InterviewSession
        currentQuestion={currentQuestion}
        isPlayingQuestion={isPlayingQuestion}
        isPlayingFeedback={isPlayingFeedback}
        isProcessing={isProcessing}
        transcription={transcription}
        interviewCompleted={interviewCompleted}
        summary={summary}
        showSummary={showSummary}
        selectedTechs={selectedTechs}
        experienceYears={experienceYears}
        sessionId={sessionId}
        isLoadingSummary={isLoadingSummary}
        onPlayQuestionAudio={playQuestionAudio}
        onSubmitAnswer={submitAnswer}
        onResetInterview={resetInterview}
        onShowSummary={() => setShowSummary(true)}
      />
    </>
  );
}