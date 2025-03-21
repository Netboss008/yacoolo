import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function analyzeLegalContent(
  streamId: string,
  transcription: string,
  streamerId: string
) {
  try {
    const settings = await prisma.streamerSettings.findUnique({
      where: { streamerId }
    });

    if (!settings?.legalAnalysis) {
      return null;
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Du bist ein Experte für Medienrecht. Analysiere den Text auf rechtlich relevante Aussagen und gib die entsprechenden Gesetzesparagraphen an."
        },
        {
          role: "user",
          content: transcription
        }
      ]
    });

    const analysis = JSON.parse(response.choices[0].message.content || '[]');

    // Speichere rechtliche Analysen
    await Promise.all(
      analysis.map(async (item: any) => {
        await prisma.legalAnalysis.create({
          data: {
            streamId,
            paragraph: item.paragraph,
            description: item.description,
            severity: item.severity,
            transcription: item.transcription
          }
        });
      })
    );

    return analysis;
  } catch (error) {
    console.error('Fehler bei der rechtlichen Analyse:', error);
    throw error;
  }
}

export async function moderateChat(
  streamId: string,
  message: string,
  userId: string,
  streamerId: string
) {
  try {
    const settings = await prisma.streamerSettings.findUnique({
      where: { streamerId },
      include: { blockedWords: true }
    });

    if (!settings?.chatModeration) {
      return { shouldModerate: false };
    }

    const blockedWords = settings.blockedWords.map(w => w.word);
    const sensitivity = settings.sensitivityLevel / 10;

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: `Du bist ein Experte für Chat-Moderation. Analysiere die Nachricht auf unangemessene Inhalte. 
                   Berücksichtige dabei die geblockten Wörter: ${blockedWords.join(', ')} 
                   und die Empfindlichkeit: ${sensitivity}`
        },
        {
          role: "user",
          content: message
        }
      ]
    });

    const moderation = JSON.parse(response.choices[0].message.content || '{}');

    if (moderation.shouldModerate) {
      // Speichere Moderations-Log
      await prisma.chatModerationLog.create({
        data: {
          streamId,
          message,
          userId,
          reason: moderation.reason,
          action: moderation.action
        }
      });
    }

    return moderation;
  } catch (error) {
    console.error('Fehler bei der Chat-Moderation:', error);
    throw error;
  }
}

export async function learnFromModeration(
  streamId: string,
  streamerId: string,
  moderationLogs: any[]
) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Analysiere die Moderations-Logs und lerne daraus für zukünftige Moderationen."
        },
        {
          role: "user",
          content: JSON.stringify(moderationLogs)
        }
      ]
    });

    const learnings = JSON.parse(response.choices[0].message.content || '{}');

    // Aktualisiere Streamer-Einstellungen basierend auf den Erkenntnissen
    if (learnings.suggestedBlockedWords) {
      await Promise.all(
        learnings.suggestedBlockedWords.map(async (word: string) => {
          await prisma.blockedWord.create({
            data: {
              word,
              streamerId
            }
          });
        })
      );
    }

    if (learnings.suggestedSensitivity) {
      await prisma.streamerSettings.update({
        where: { streamerId },
        data: {
          sensitivityLevel: learnings.suggestedSensitivity
        }
      });
    }

    return learnings;
  } catch (error) {
    console.error('Fehler beim Lernen aus der Moderation:', error);
    throw error;
  }
} 