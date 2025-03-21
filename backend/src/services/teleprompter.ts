import OpenAI from 'openai';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function generateScriptSections(content: string) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Du bist ein Experte für Stream-Skripte. Teile den gegebenen Inhalt in logische Abschnitte auf und extrahiere wichtige Schlüsselwörter für jeden Abschnitt."
        },
        {
          role: "user",
          content: content
        }
      ]
    });

    const sections = JSON.parse(response.choices[0].message.content || '[]');
    return sections;
  } catch (error) {
    console.error('Fehler bei der Abschnittsgenerierung:', error);
    throw new Error('Abschnittsgenerierung fehlgeschlagen');
  }
}

export async function analyzeStreamProgress(
  streamId: string,
  scriptId: string,
  transcription: string
) {
  try {
    const script = await prisma.teleprompterScript.findUnique({
      where: { id: scriptId },
      include: { sections: true }
    });

    if (!script) {
      throw new Error('Skript nicht gefunden');
    }

    const progress = await Promise.all(
      script.sections.map(async (section) => {
        const response = await openai.chat.completions.create({
          model: "gpt-4",
          messages: [
            {
              role: "system",
              content: "Analysiere, ob der gegebene Transkriptionstext die Hauptpunkte des Abschnitts enthält, auch wenn die Formulierung anders ist."
            },
            {
              role: "user",
              content: JSON.stringify({
                section: section.content,
                keywords: section.keywords,
                transcription
              })
            }
          ]
        });

        const analysis = JSON.parse(response.choices[0].message.content || '{}');
        
        return {
          sectionId: section.id,
          completed: analysis.completed,
          confidence: analysis.confidence
        };
      })
    );

    // Speichere Fortschritt
    await Promise.all(
      progress.map(async (p) => {
        if (p.completed) {
          await prisma.teleprompterProgress.create({
            data: {
              scriptId,
              sectionId: p.sectionId,
              streamId,
              completed: true,
              confidence: p.confidence
            }
          });
        }
      })
    );

    return progress;
  } catch (error) {
    console.error('Fehler bei der Fortschrittsanalyse:', error);
    throw error;
  }
}

export async function generateScriptSuggestions(
  streamId: string,
  scriptId: string,
  progress: any[]
) {
  try {
    const script = await prisma.teleprompterScript.findUnique({
      where: { id: scriptId },
      include: { sections: true }
    });

    if (!script) {
      throw new Error('Skript nicht gefunden');
    }

    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Analysiere den Fortschritt des Streams und generiere Vorschläge für Verbesserungen und Anpassungen des Skripts."
        },
        {
          role: "user",
          content: JSON.stringify({
            script: script.content,
            progress,
            sections: script.sections
          })
        }
      ]
    });

    const suggestions = JSON.parse(response.choices[0].message.content || '{}');
    return suggestions;
  } catch (error) {
    console.error('Fehler bei der Vorschlagsgenerierung:', error);
    throw error;
  }
}

export async function learnFromStream(
  streamId: string,
  scriptId: string,
  transcription: string,
  viewerEngagement: number
) {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",
      messages: [
        {
          role: "system",
          content: "Analysiere die Effektivität des Streams und lerne daraus für zukünftige Skripte."
        },
        {
          role: "user",
          content: JSON.stringify({
            scriptId,
            transcription,
            viewerEngagement
          })
        }
      ]
    });

    const learnings = JSON.parse(response.choices[0].message.content || '{}');
    
    // Speichere Erkenntnisse für zukünftige Skripte
    await prisma.teleprompterScript.update({
      where: { id: scriptId },
      data: {
        content: learnings.updatedContent,
        sections: {
          updateMany: {
            where: {},
            data: {
              keywords: learnings.updatedKeywords
            }
          }
        }
      }
    });

    return learnings;
  } catch (error) {
    console.error('Fehler beim Lernen aus dem Stream:', error);
    throw error;
  }
} 