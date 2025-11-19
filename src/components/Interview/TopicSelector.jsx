import React from "react";
import { Plus, X } from "lucide-react";
import { Label } from "../ui/SectionTitle";
import { Button } from "../ui/Button";
import { Card } from "../ui/Card";

export const TopicSelector = ({
  selectedTechs,
  onAddSubtopic,
  onRemoveSubtopic,
  onUpdateQuestions,
}) => {
  const handleKeyPress = (e, tech) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      const input = document.getElementById(`sub_${tech}`);
      onAddSubtopic(tech, input.value);
      input.value = "";
    }
  };

  const handleAddClick = (tech) => {
    const input = document.getElementById(`sub_${tech}`);
    onAddSubtopic(tech, input.value);
    input.value = "";
  };

  if (selectedTechs.length === 0) {
    return (
      <div className="text-center m-auto h-auto w-fit">
        <h1 className="text-4xl font-bold text-gray-900">AI Mock Interview</h1>
        <p className="text-gray-600 text-lg mt-1">Select technologies and configure topics</p>
      </div>
    );
  }

  return (
    <div className="max-h-[calc(100dvh_-_240px)] flex flex-col overflow-auto">
      <Label className="mb-2 block">
        Click to configure:
      </Label>

      <div className={selectedTechs.filter(t => t.open).length > 1 ? "grid grid-cols-1 gap-3" : ""}>
        {selectedTechs.map((t) =>
          t.open ? (
            <Card
              key={t.tech}
              variant="gradient"
              padding="sm"
              className="space-y-3"
            >
              <div className="bg-gradient-to-br w-fit from-indigo-500 to-indigo-600 text-white px-4.5 py-1.5 rounded-lg flex items-center gap-2 cursor-pointer hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-sm hover:shadow-md">
                <span className="text-sm text-white">{t.tech}</span>
              </div>

              <div>
                <Label size="xs" className="text-gray-700 font-medium">Add Subtopic (Optional)</Label>
                <div className="flex gap-6 items-center mt-1.5">
                  <div className="flex gap-2 flex-1">
                    <input
                      type="text"
                      id={`sub_${t.tech}`}
                      placeholder="e.g. Hooks"
                      className="flex-1 border border-gray-300 px-3.5 py-3 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition text-sm text-gray-900"
                      onKeyPress={(e) => handleKeyPress(e, t.tech)}
                    />
                    <Button
                      onClick={() => handleAddClick(t.tech)}
                      variant="primary"
                      size="sm"
                      icon={Plus}
                      className="px-3 py-2.5 shadow-lg"
                    />
                  </div>
                  <div className="flex-1">
                    <Label size="xs" className="text-gray-700 font-medium">
                      Questions: <span className="text-indigo-600 font-semibold">{t.questions}</span>
                    </Label>
                    <input
                      type="range"
                      min="1"
                      max="15"
                      value={t.questions}
                      onChange={(e) => onUpdateQuestions(t.tech, parseInt(e.target.value))}
                      className="w-full mt-1.5"
                    />
                  </div>
                </div>

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
                          onClick={() => onRemoveSubtopic(t.tech, s)}
                        />
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          ) : null
        )}
      </div>
    </div>
  );
};