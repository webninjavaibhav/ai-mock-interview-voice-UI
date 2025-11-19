import React from "react";
import { Mic, Square } from "lucide-react";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export const AudioControls = ({
  isRecording,
  isProcessing,
  isPlayingQuestion,
  isPlayingFeedback,
  transcription,
  feedbackMessage,
  onStartRecording,
  onStopRecording,
}) => {
  return (
    <Card variant="default" padding="md" className="mb-6 bg-gray-50">
      <div className="flex flex-col items-center gap-4">
        {!isRecording && !isProcessing && !isPlayingFeedback && (
          <Button
            onClick={onStartRecording}
            disabled={isPlayingQuestion}
            variant="danger"
            size="lg"
            icon={Mic}
            className="rounded-full"
          >
            Start Recording Answer
          </Button>
        )}

        {isRecording && (
          <Button
            onClick={onStopRecording}
            variant="neutral"
            size="lg"
            icon={Square}
            className="rounded-full"
          >
            Stop Recording
          </Button>
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
        <Card variant="default" padding="sm" className="mt-6 border border-gray-200">
          <p className="text-xs text-gray-500 mb-2">
            Your answer (transcribed):
          </p>
          <p className="text-gray-700 italic">"{transcription}"</p>
        </Card>
      )}

      {feedbackMessage && !isProcessing && !isPlayingFeedback && (
        <Card variant="info" padding="sm" className="mt-4">
          <p className="text-sm text-blue-700">{feedbackMessage}</p>
        </Card>
      )}
    </Card>
  );
};