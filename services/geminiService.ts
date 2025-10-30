// services/geminiService.ts
// This service has been disabled as per user request.

export const generatePhraseSuggestions = async (topic: string): Promise<string[]> => {
    console.warn("AI phrase generation is disabled.");
    // Return an empty array to fulfill the function signature without making an API call.
    return Promise.resolve([]);
};