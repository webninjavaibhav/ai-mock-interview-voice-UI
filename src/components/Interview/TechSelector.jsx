import React from "react";

export const TechSelector = ({ availableTopics, selectedTechs, onToggleTech }) => {
  return (
    <div>
      <label className="text-sm font-semibold text-gray-800 mb-2 block">
        Select Technologies
      </label>

      <div className="border border-gray-200 rounded-lg p-3 bg-gradient-to-br from-gray-50 to-slate-50 max-h-[calc(100dvh_-_190px)] overflow-y-auto">
        <div className="grid grid-cols-1 gap-2">
          {availableTopics.map((tech) => {
            const isSelected = selectedTechs.find((t) => t.tech === tech);
            return (
              <label
                key={tech}
                className={`flex items-center gap-2 p-2.5 rounded-lg cursor-pointer  ${
                  isSelected
                    ? "bg-gradient-to-br from-indigo-50 to-blue-50 border border-indigo-400 text-indigo-900"
                    : "bg-white border border-gray-200 text-gray-700 hover:border-indigo-200 hover:bg-indigo-50/30"
                }`}
              >
                <input
                  type="checkbox"
                  checked={!!isSelected}
                  onChange={() => onToggleTech(tech)}
                  className="w-4 h-4 text-indigo-600 rounded"
                />
                <span className="text-sm font-medium">{tech}</span>
              </label>
            );
          })}
        </div>
      </div>
    </div>
  );
};