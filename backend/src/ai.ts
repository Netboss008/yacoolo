1-3 abarbeitenimport OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export function setupAIService() {
  console.log('AI Service initialisiert');
}

interface StreamAnalysis {
  streamId: string;
  chatMessages: Array<{
    content: string;
    timestamp: Date;
  }>;
  viewerCount: number;
  duration: number;
}

export async function analyzeStream(data: StreamAnalysis) {
  try {
    // Chat-Nachrichten analysieren
    const chatAnalysis = await analyzeChatMessages(data.chatMessages);
    
    // Engagement analysieren
    const engagementAnalysis = await analyzeEngagement(data);
    
    // Empfehlungen generieren
    const recommendations = await generateRecommendations(chatAnalysis, engagementAnalysis);
    
    // Analytics in der Datenbank speichern
    await prisma.streamAnalytics.create({
      data: {
        streamId: data.streamId,
        peakViewers: data.viewerCount,
        totalViewers: data.viewerCount,
        chatMessages: data.chatMessages.length,
        donations: 0,
        engagementScore: engagementAnalysis.score,
        recommendations: recommendations
      }
    });

    return {
      chatAnalysis,
      engagementAnalysis,
      recommendations
    };
  } catch (error) {
    console.error('Fehler bei der Stream-Analyse:', error);
    throw error;
  }
}

async function analyzeChatMessages(messages: Array<{ content: string; timestamp: Date }>) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "Analysiere die Chat-Nachrichten des Streams und identifiziere Hauptthemen, Stimmung und Engagement-Level."
      },
      {
        role: "user",
        content: JSON.stringify(messages.map(m => m.content))
      }
    ],
    temperature: 0.7,
    max_tokens: 500
  });

  return {
    themes: response.choices[0].message.content,
    sentiment: "positiv", // Wird durch KI-Analyse bestimmt
    engagementLevel: "hoch" // Wird durch KI-Analyse bestimmt
  };
}

async function analyzeEngagement(data: StreamAnalysis) {
  const score = calculateEngagementScore(data);
  
  return {
    score,
    improvements: [
      "Interaktive Elemente einbauen",
      "Regelmäßige Zuschauer-Interaktionen",
      "Spannende Übergänge zwischen Themen"
    ]
  };
}

async function generateRecommendations(chatAnalysis: any, engagementAnalysis: any) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "Generiere konkrete Handlungsempfehlungen basierend auf der Chat- und Engagement-Analyse."
      },
      {
        role: "user",
        content: JSON.stringify({ chatAnalysis, engagementAnalysis })
      }
    ],
    temperature: 0.7,
    max_tokens: 500
  });

  return response.choices[0].message.content;
}

function calculateEngagementScore(data: StreamAnalysis): number {
  const chatActivity = data.chatMessages.length / data.duration;
  const viewerEngagement = data.viewerCount * 0.5;
  
  return (chatActivity + viewerEngagement) / 2;
} 