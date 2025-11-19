import { Volume2, Play, Loader2 } from "lucide-react";
import { AudioControls } from "./AudioControls";
import { useAudioRecorder } from "../../hooks/useAudioRecorder";
import { Button } from "../ui/Button";
import { Card, CardHeader, CardContent, CardFooter } from "../ui/Card";
import { SectionTitle } from "../ui/SectionTitle";

export const InterviewSession = ({
  currentQuestion,
  isPlayingQuestion,
  isPlayingFeedback,
  isProcessing,
  transcription,
  feedbackMessage,
  interviewCompleted,
  summary,
  showSummary,
  selectedTechs,
  experienceYears,
  sessionId,
  isLoadingSummary,
  onPlayQuestionAudio,
  onSubmitAnswer,
  onResetInterview,
  onShowSummary,
}) => {
  const { isRecording, startRecording, stopRecording } = useAudioRecorder();

  const handleStartRecording = async () => {
    const audioBlob = await startRecording();
    if (audioBlob) {
      await onSubmitAnswer(audioBlob);
    }
  };

  const getExperienceLevelText = (years) => {
    if (years === 0) return "Fresher / Entry Level";
    if (years <= 2) return `Junior (${years} ${years === 1 ? 'year' : 'years'})`;
    if (years <= 5) return `Mid-Level (${years} years)`;
    return `Senior (${years}+ years)`;
  };

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

  return (
    <div className="min-h-screen flex bg-gradient-to-br from-purple-50 via-indigo-100 to-pink-100 p-4">
      <div className="max-w-4xl m-auto h-full p-5">
        {interviewCompleted && summary && !showSummary && (
          <Card variant="elevated" padding="lg" className="mb-6">
            <div className="text-center flex flex-col items-center justify-center">
              <div className="inline-block p-4 bg-green-100 rounded-full mb-5">
                <Volume2 className="w-10 h-10 text-green-600" />
              </div>
              <SectionTitle size="lg" className="mb-2">
                Interview Completed! 🎉
              </SectionTitle>
              <p className="text-gray-600 mb-8">
                Great job! Your interview has been completed successfully.
              </p>
              <Button
                onClick={onShowSummary}
                variant="primary"
                size="lg"
              >
                Show My Summary
              </Button>
            </div>
          </Card>
        )}

        {showSummary && summary && (
          <Card variant="elevated" padding="lg" className="mb-6">
            <CardHeader>
              <div className="flex items-center justify-between">
                <SectionTitle size="lg">Interview Summary</SectionTitle>
                <div className="text-sm text-gray-500">
                  {summary.questions_completed} Questions Completed
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-6">
              {summary.summary.split('\n').map((line, index) => {
                const cleanLine = line.replace(/\*\*/g, '').replace(/##/g, '').trim();
                
                if (!cleanLine) return null;
                
                if (cleanLine.includes(':') && cleanLine.split(':')[1].trim() === '') {
                  return (
                    <h3 key={index} className="text-xl font-semibold text-indigo-700 mt-4">
                      {cleanLine.replace(':', '')}
                    </h3>
                  );
                }
                
                if (cleanLine.toLowerCase().includes('rating') || cleanLine.toLowerCase().includes('/10')) {
                  return (
                    <Card key={index} variant="highlight" padding="sm">
                      <p className="text-lg font-semibold text-indigo-900">{cleanLine}</p>
                    </Card>
                  );
                }
                
                if (cleanLine.startsWith('-')) {
                  return (
                    <div key={index} className="flex gap-3 ml-4">
                      <span className="text-indigo-600 mt-1">•</span>
                      <p className="text-gray-700 flex-1">{cleanLine.substring(1).trim()}</p>
                    </div>
                  );
                }
                
                return (
                  <p key={index} className="text-gray-700 leading-relaxed">
                    {cleanLine}
                  </p>
                );
              })}
            </CardContent>

            <CardFooter>
              <Button
                onClick={onResetInterview}
                variant="primary"
                size="md"
                className="w-full"
              >
                Start New Interview
              </Button>
            </CardFooter>
          </Card>
        )}

        {!interviewCompleted && (
          <Card variant="elevated" padding="lg">
            <div className="flex justify-between items-center mb-8">
              <div>
                <SectionTitle size="md">
                  Mock Interview
                </SectionTitle>
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
                <Card variant="highlight" padding="md" className="mb-6">
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
                </Card>

                <AudioControls
                  isRecording={isRecording}
                  isProcessing={isProcessing}
                  isPlayingQuestion={isPlayingQuestion}
                  isPlayingFeedback={isPlayingFeedback}
                  transcription={transcription}
                  feedbackMessage={feedbackMessage}
                  onStartRecording={handleStartRecording}
                  onStopRecording={stopRecording}
                />

                <div className="flex gap-4">
                  <Button
                    onClick={() => onPlayQuestionAudio(sessionId)}
                    disabled={isPlayingQuestion || isRecording || isProcessing || isPlayingFeedback}
                    variant="secondary"
                    size="md"
                    icon={Play}
                    className="flex-1"
                  >
                    Replay Question
                  </Button>
                  <Button
                    onClick={onResetInterview}
                    variant="ghost"
                    size="md"
                  >
                    Exit
                  </Button>
                </div>
              </div>
            )}
          </Card>
        )}
      </div>
    </div>
  );
};