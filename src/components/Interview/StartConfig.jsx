import React, { useState, useEffect } from "react";
import { Briefcase } from "lucide-react";
import { TechSelector } from "./TechSelector";
import { TopicSelector } from "./TopicSelector";
import { api } from "../../utils/api";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";
import { Label } from "../ui/SectionTitle";

export const StartConfig = ({ onStart }) => {
  const [availableTopics, setAvailableTopics] = useState([]);
  const [selectedTechs, setSelectedTechs] = useState([]);
  const [experienceYears, setExperienceYears] = useState(0);
  const [multiTopicError, setMultiTopicError] = useState("");
  const [isStartingInterview, setIsStartingInterview] = useState(false);

  useEffect(() => {
    loadTopics();
  }, []);

  const loadTopics = async () => {
    try {
      const data = await api.getTopics();
      setAvailableTopics(data.topics);
    } catch (error) {
      console.error("Error loading topics:", error);
      setAvailableTopics(["React", "JavaScript", "Node.js", "TypeScript", "Python"]);
    }
  };

  const handleToggleTech = (tech) => {
    const isSelected = selectedTechs.find((t) => t.tech === tech);
    if (isSelected) {
      setSelectedTechs((s) => s.filter((t) => t.tech !== tech));
    } else {
      setSelectedTechs((s) => [
        ...s,
        {
          tech,
          subtopics: [],
          questions: 1,
          open: true,
        },
      ]);
    }
  };

  const handleAddSubtopic = (tech, newTopic) => {
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
  };

  const handleRemoveSubtopic = (tech, sub) => {
    setSelectedTechs((s) =>
      s.map((t) =>
        t.tech === tech ? { ...t, subtopics: t.subtopics.filter((ss) => ss !== sub) } : t
      )
    );
  };

  const handleUpdateQuestions = (tech, value) => {
    setSelectedTechs((s) =>
      s.map((t) => (t.tech === tech ? { ...t, questions: value } : t))
    );
  };

  const getTotalQuestions = () => {
    return selectedTechs.reduce((sum, t) => sum + t.questions, 0);
  };

  const getExperienceLevelText = (years) => {
    if (years === 0) return "Fresher / Entry Level";
    if (years <= 2) return `Junior (${years} ${years === 1 ? 'year' : 'years'})`;
    if (years <= 5) return `Mid-Level (${years} years)`;
    return `Senior (${years}+ years)`;
  };

  const handleStartInterview = async () => {
    if (selectedTechs.length === 0) {
      setMultiTopicError("Please select at least one technology.");
      return;
    }

    setMultiTopicError("");
    setIsStartingInterview(true);

    try {
      await onStart(selectedTechs, experienceYears);
    } catch (error) {
      console.error("Error starting interview:", error);
    } finally {
      setIsStartingInterview(false);
    }
  };

  const totalQuestions = getTotalQuestions();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 w-full to-indigo-50 flex items-center justify-center p-4">
      <Card variant="default" padding="md" className="w-full space-y-4">
        <div className="grid grid-cols-[1fr_2fr] w-full gap-4">
          <TechSelector
            availableTopics={availableTopics}
            selectedTechs={selectedTechs}
            onToggleTech={handleToggleTech}
          />

          <TopicSelector
            selectedTechs={selectedTechs}
            onAddSubtopic={handleAddSubtopic}
            onRemoveSubtopic={handleRemoveSubtopic}
            onUpdateQuestions={handleUpdateQuestions}
          />
        </div>

        <div className="grid grid-cols-[1fr_2fr] items-center justify-between w-full gap-4 items-center pt-2">
          <div>
            <Label className="mb-2 flex items-center gap-2">
              <Briefcase size={16} className="text-gray-600" /> Experience Level: <span className="text-indigo-600 font-semibold">{getExperienceLevelText(experienceYears)}</span>
            </Label>
            <input
              type="range"
              min="0"
              max="10"
              value={experienceYears}
              onChange={(e) => setExperienceYears(parseInt(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="flex justify-end w-full mr-0 ml-auto gap-5">
            {selectedTechs.length > 0 && (
              <Card variant="highlight" padding="sm" className="!rounded-md w-[210px] h-[50px] flex items-center justify-center">
                <p className="text-base text-indigo-900 text-center">
                  Total Questions: <span className=" font-semibold">{totalQuestions}</span>
                </p>
              </Card>
            )}

            <Button
              onClick={handleStartInterview}
              disabled={isStartingInterview || selectedTechs.length === 0}
              variant="primary"
              size="md"
              className="w-[210px] h-[50px] !rounded-md"
            >
              {isStartingInterview ? "Preparing..." : "Start Interview"}
            </Button>
          </div>
        </div>

        {multiTopicError && (
          <p className="text-red-700 text-sm text-center bg-red-50 p-2 rounded-lg border border-red-200">{multiTopicError}</p>
        )}
      </Card>
    </div>
  );
};