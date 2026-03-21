import dotenv from 'dotenv';
dotenv.config();

const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434/api/generate';
const OLLAMA_MODEL = process.env.OLLAMA_MODEL || 'llama3.1';

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
    try {
        const response = await fetch(OLLAMA_URL, {
            method: 'POST',
            body: JSON.stringify({
                model: OLLAMA_MODEL,
                prompt,
                format: 'json',
                stream: false
            }),
            headers: { 
                'Content-Type': 'application/json'
            }
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Ollama Error: ${response.status} - ${errorText}`);
        }
        
        const data: any = await response.json();
        const content = data.response;
        
        return content ? JSON.parse(content) : null;
    } catch (error) {
        console.error('AI Service Error (Ollama):', error);
        return null;
    }
}

export const aiService = {
    analyzeComplaint: async (description: string, category: string, citizenHistory: string[] = []): Promise<AIAnalysis & { repeatPatternFlag?: boolean }> => {
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
        
        // Fallback defaults
        return result || {
            suggestedPriority: 'Medium',
            sentimentScore: 50,
            urgencyLevel: 'Medium',
            estimatedResolutionDays: 7,
            summary: description.substring(0, 50) + '...',
            isDuplicate: false,
            recommendedDepartment: category || 'General',
            tags: [category],
            repeatPatternFlag: false
        };
    },
    parseIncomingMessage: async (text: string, phoneOrEmail: string): Promise<{
        category: string;
        description: string;
        location: string;
        priority: 'Low' | 'Medium' | 'High' | 'Urgent';
    }> => {
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
        return result || {
            category: 'General',
            description: text,
            location: 'Unknown',
            priority: 'Medium'
        };
    },

    generateResolutionSuggestion: async (complaintDetails: any): Promise<ResolutionSuggestion> => {
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

        return result || {
            steps: ['Review complaint details', 'Dispatch field officer', 'Verify resolution', 'Notify citizen'],
            estimatedEffort: '48 hours',
            requiredResources: ['Field Officer', 'Vehicle'],
            similarPastCases: []
        };
    },

    detectAnomaly: async (recentComplaints: any[]): Promise<AnomalyReport> => {
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

        return result || {
            isAnomaly: false,
            reason: 'No significant patterns detected',
            affectedArea: 'None',
            suggestedAction: 'Continue standard monitoring'
        };
    }
};
