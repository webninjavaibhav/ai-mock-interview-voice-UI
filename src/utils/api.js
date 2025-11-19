const API_URL = process.env.REACT_APP_API_URL;

export const api = {
  async getTopics() {
    const response = await fetch(`${API_URL}/topics`);
    return response.json();
  },

  async startInterview(data) {
    const response = await fetch(`${API_URL}/interview/start`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });
    if (!response.ok) throw new Error("Failed to start interview");
    return response.json();
  },

  async getQuestion(sessionId) {
    const response = await fetch(`${API_URL}/interview/${sessionId}/question`);
    return response.json();
  },

  async getQuestionAudio(sessionId) {
    const response = await fetch(`${API_URL}/interview/${sessionId}/audio/question`);
    return response.blob();
  },

  async submitAnswer(sessionId, audioBlob) {
    const formData = new FormData();
    formData.append("audio", audioBlob, "answer.webm");

    const response = await fetch(`${API_URL}/interview/${sessionId}/answer`, {
      method: "POST",
      body: formData,
    });

    const transcriptionText = response.headers.get("X-Transcription");
    const shouldLoadNext = response.headers.get("X-Should-Load-Next");
    const isComplete = response.headers.get("X-Interview-Complete");

    const audioBlob2 = await response.blob();

    return {
      transcription: transcriptionText,
      shouldLoadNext: shouldLoadNext === "true",
      isComplete: isComplete === "true",
      audioBlob: audioBlob2,
    };
  },

  async getSummary(sessionId) {
    const response = await fetch(`${API_URL}/interview/${sessionId}/summary`);
    return response.json();
  },
};