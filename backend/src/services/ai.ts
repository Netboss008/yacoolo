import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateTeamLogo(teamName: string): Promise<string> {
  try {
    // Generiere Logo-Prompt mit KI
    const promptResponse = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Du bist ein Experte für Logo-Design. Erstelle einen detaillierten Prompt für DALL-E, der ein modernes, einzigartiges Logo für ein E-Sports-Team generiert."
        },
        {
          role: "user",
          content: `Erstelle einen Prompt für ein Logo für das Team "${teamName}". Das Logo sollte modern, minimalistisch und für E-Sports geeignet sein.`
        }
      ]
    });

    const logoPrompt = promptResponse.choices[0].message.content;

    // Generiere Logo mit DALL-E
    const imageResponse = await openai.images.generate({
      model: "dall-e-3",
      prompt: logoPrompt || "Ein modernes, minimalistisches E-Sports-Team-Logo",
      n: 1,
      size: "1024x1024",
      quality: "standard",
      style: "vivid"
    });

    const logoUrl = imageResponse.data[0].url;

    // Speichere Logo-URL in der Datenbank
    await prisma.team.update({
      where: { name: teamName },
      data: { logo: logoUrl }
    });

    return logoUrl;
  } catch (error) {
    console.error('Fehler bei der Logo-Generierung:', error);
    throw new Error('Logo-Generierung fehlgeschlagen');
  }
}

export async function analyzeStream(streamId: string) {
  try {
    const stream = await prisma.stream.findUnique({
      where: { id: streamId },
      include: {
        chatMessages: true,
        analytics: true
      }
    });

    if (!stream) {
      throw new Error('Stream nicht gefunden');
    }

    // Analysiere Chat-Nachrichten
    const chatAnalysis = await analyzeChatMessages(stream.chatMessages);
    
    // Analysiere Engagement
    const engagementAnalysis = await analyzeEngagement(stream);

    // Generiere Empfehlungen
    const recommendations = await generateRecommendations(chatAnalysis, engagementAnalysis);

    // Aktualisiere Stream-Analytics
    await prisma.streamAnalytics.update({
      where: { streamId },
      data: {
        chatAnalysis: chatAnalysis,
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

async function analyzeChatMessages(messages: any[]) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "Analysiere die Chat-Nachrichten eines Live-Streams und identifiziere Hauptthemen, Stimmungen und Verbesserungspotenzial."
      },
      {
        role: "user",
        content: JSON.stringify(messages)
      }
    ]
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

async function analyzeEngagement(stream: any) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "Analysiere das Engagement eines Streams basierend auf Zuschauerzahlen, Chat-Aktivität und Stream-Dauer."
      },
      {
        role: "user",
        content: JSON.stringify(stream)
      }
    ]
  });

  return JSON.parse(response.choices[0].message.content || '{}');
}

async function generateRecommendations(chatAnalysis: any, engagementAnalysis: any) {
  const response = await openai.chat.completions.create({
    model: "gpt-4",
    messages: [
      {
        role: "system",
        content: "Generiere konkrete Handlungsempfehlungen für Streamer basierend auf Chat- und Engagement-Analysen."
      },
      {
        role: "user",
        content: JSON.stringify({ chatAnalysis, engagementAnalysis })
      }
    ]
  });

  return JSON.parse(response.choices[0].message.content || '{}');
} 