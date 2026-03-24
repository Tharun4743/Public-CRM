import dotenv from 'dotenv';
dotenv.config();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434/api/generate';
const AI_API_KEY = process.env.AI_API_KEY;
const AI_MODEL = process.env.AI_MODEL || 'meta-llama/llama-3.1-8b-instruct:free';
const OPENROUTER_FALLBACK_MODELS = [
    AI_MODEL,
    process.env.AI_FALLBACK_MODEL,
    'openai/gpt-4o-mini',
    'meta-llama/llama-3.1-8b-instruct:free'
].filter((m, i, arr): m is string => !!m && arr.indexOf(m) === i);

export interface AIAnalysis {
    suggestedPriority: string;
    sentimentScore: number; // 0-100
    urgencyLevel: 'Low' | 'Medium' | 'High' | 'Urgent';
    estimatedResolutionDays: number;
    summary: string;
    isDuplicate: boolean;
    recommendedDepartment: string;
    tags: string[];
}

export interface ResolutionSuggestion {
    steps: string[];
    estimatedEffort: string;
    requiredResources: string[];
    similarPastCases: string[];
}

export interface AnomalyReport {
    isAnomaly: boolean;
    reason: string;
    affectedArea: string;
    suggestedAction: string;
}

async function callAI(prompt: string): Promise<any> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 8000);

    try {
        if (AI_API_KEY) {
            let lastOpenRouterError: string | null = null;
            for (const model of OPENROUTER_FALLBACK_MODELS) {
                const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
                    method: 'POST',
                    headers: {
                        'Authorization': `Bearer ${AI_API_KEY}`,
                        'HTTP-Referer': 'https://pscrm.teamgoat.com',
                        'X-Title': 'Smart Public Service CRM',
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        model,
                        messages: [
                            { role: 'user', content: prompt + "\nRespond only with the requested JSON object." }
                        ],
                        response_format: { type: 'json_object' }
                    }),
                    signal: controller.signal
                });

                if (!response.ok) {
                    const errorText = await response.text();
                    lastOpenRouterError = `Model ${model} failed: ${response.status} - ${errorText}`;
                    continue;
                }

                clearTimeout(timeout);
                const data = await response.json();
                const content = data.choices[0].message.content;
                if (!content) continue;
                return safeParseAIJson(content);
            }

            console.error('OpenRouter all-model attempts failed:', lastOpenRouterError);
        } else {
            // continue to Ollama fallback block below
        }

        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            body: JSON.stringify({
                model: process.env.OLLAMA_MODEL || 'llama3.1',
                prompt,
                format: 'json',
                stream: false
            }),
            headers: {
                'Content-Type': 'application/json'
            },
            signal: controller.signal
        });

        clearTimeout(timeout);
        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ollama Error: ${response.status} - ${errorText}`);
        }

        const data: any = await response.json();
        const content = data.response;
        if (!content) return null;
        return safeParseAIJson(content);
    } catch (error) {
        clearTimeout(timeout);
        console.error('AI Service HTTP Error:', error);
        throw error; // Re-throw to be caught by the individual functions' try/catch
    }
}

function safeParseAIJson(content: string): any {
    try {
        return JSON.parse(content);
    } catch {
        const cleaned = content
            .replace(/```json/gi, '')
            .replace(/```/g, '')
            .trim();
        const start = cleaned.indexOf('{');
        const end = cleaned.lastIndexOf('}');
        if (start !== -1 && end !== -1 && end > start) {
            return JSON.parse(cleaned.slice(start, end + 1));
        }
        throw new Error('Could not parse AI JSON response');
    }
}

export const aiService = {
    analyzeComplaint: async (description: string, category: string, citizenHistory: string[] = []): Promise<AIAnalysis & { repeatPatternFlag?: boolean }> => {
        const fallback = {
            suggestedPriority: 'Medium',
            sentimentScore: 50,
            urgencyLevel: 'Medium' as 'Medium',
            estimatedResolutionDays: 7,
            summary: description.substring(0, 50) + '...',
            isDuplicate: false,
            recommendedDepartment: category || 'General',
            tags: [category],
            repeatPatternFlag: false
        };

        try {
            const prompt = `
                Analyze the following public service complaint and return a JSON object.
                Description: "${description}"
                Category: "${category}"

                Return JSON with:
                {
                    "suggestedPriority": "Low" | "Medium" | "High" | "Urgent",
                    "sentimentScore": number (0-100, where 0 is very angry, 100 is very calm),
                    "urgencyLevel": "Low" | "Medium" | "High" | "Urgent",
                    "estimatedResolutionDays": number,
                    "summary": "one line summary",
                    "isDuplicate": boolean,
                    "recommendedDepartment": "Suggested Department Name",
                    "tags": ["tag1", "tag2"],
                    "repeatPatternFlag": boolean
                }
                Repeat citizen categories history: ${JSON.stringify(citizenHistory)}
            `;
            const result = await callAI(prompt);
            console.log(`[AI] Analysis result:`, result);
            return result || fallback;
        } catch (error) {
            console.error('analyzeComplaint AI Fallback Triggered:', error);
            return fallback;
        }
    },
    parseIncomingMessage: async (text: string, phoneOrEmail: string): Promise<{
        category: string;
        description: string;
        location: string;
        priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    }> => {
        const fallback = {
            category: 'General',
            description: text,
            location: 'Unknown',
            priority: 'Medium' as 'Medium'
        };

        try {
            const prompt = `
                Parse this incoming citizen message into structured JSON.
                Sender: "${phoneOrEmail}"
                Message: "${text}"
                Return only:
                {
                  "category": "Sanitation|Water Supply|Electricity|Roads & Transport|Public Safety|General",
                  "description": "cleaned complaint description",
                  "location": "best inferred location or Unknown",
                  "priority": "Low|Medium|High|Urgent"
                }
            `;
            const result = await callAI(prompt);
            return result || fallback;
        } catch (error) {
            console.error('parseIncomingMessage AI Fallback Triggered:', error);
            return fallback;
        }
    },

    generateResolutionSuggestion: async (complaintDetails: any): Promise<ResolutionSuggestion> => {
        const fallback = {
            steps: ['Review complaint details', 'Dispatch field officer', 'Verify resolution', 'Notify citizen'],
            estimatedEffort: '48 hours',
            requiredResources: ['Field Officer', 'Vehicle'],
            similarPastCases: []
        };

        try {
            const prompt = `
                Based on this complaint, suggest a resolution plan in JSON format.
                Title/Category: "${complaintDetails.category}"
                Description: "${complaintDetails.description}"

                Return JSON with:
                {
                    "steps": ["step 1", "step 2", ...],
                    "estimatedEffort": "e.g. 2 hours",
                    "requiredResources": ["resource 1", ...],
                    "similarPastCases": ["Case ID 1", ...]
                }
            `;

            const result = await callAI(prompt);
            return result || fallback;
        } catch (error) {
            console.error('generateResolutionSuggestion AI Fallback Triggered:', error);
            return fallback;
        }
    },

    detectAnomaly: async (recentComplaints: any[]): Promise<AnomalyReport> => {
        const fallback = {
            isAnomaly: false,
            reason: 'No significant patterns detected',
            affectedArea: 'None',
            suggestedAction: 'Continue standard monitoring'
        };

        try {
            const complaintsStr = JSON.stringify(recentComplaints.map(c => ({ cat: c.category, loc: c.department })));
            const prompt = `
                Detect spikes or anomalies in these recent complaints and return JSON.
                Data: ${complaintsStr}

                Return JSON with:
                {
                    "isAnomaly": boolean,
                    "reason": "description of spike",
                    "affectedArea": "department/location",
                    "suggestedAction": "what to do"
                }
            `;

            const result = await callAI(prompt);
            return result || fallback;
        } catch (error) {
            console.error('detectAnomaly AI Fallback Triggered:', error);
            return fallback;
        }
    }
};
