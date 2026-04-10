import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import { DYNAMIC_MODULE_SYSTEM_PROMPT } from "@/lib/prompts";

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

export const maxDuration = 60; // Increase Vercel function timeout due to LLM generation

export async function POST(req: Request) {
  try {
    const { moduleContext, previousAnswers } = await req.json();

    if (!moduleContext) {
      return NextResponse.json(
        { error: "Missing module context." },
        { status: 400 }
      );
    }

    // Build the payload
    let promptContent = `MODULE CONTEXT (Area of Focus): ${moduleContext}\n\n`;

    if (previousAnswers && previousAnswers.length > 0) {
      promptContent += "PREVIOUS ANSWERS IN THIS MODULE SEQUENCE:\n";
      previousAnswers.forEach((ans: any, i: number) => {
        promptContent += `\nQuestion ${i + 1}: ${ans.questionTitle}`;
        promptContent += `\nSelected Option: ${ans.selectedOptionLabel}`;
        promptContent += `\nOpen Text Context: "${ans.openText}"\n`;
      });
    } else {
      promptContent += "No previous answers yet. This is the very first question of the sequence.";
    }

    promptContent += "\nGenerate the NEXT drill-down question and 4 multiple-choice options in the strict JSON format specified.";

    const message = await anthropic.messages.create({
      model: "claude-3-5-sonnet-20241022",
      max_tokens: 1024,
      system: DYNAMIC_MODULE_SYSTEM_PROMPT,
      messages: [{ role: "user", content: promptContent }],
      temperature: 0.7,
    });

    const responseText = message.content[0].type === "text" ? message.content[0].text : "";
    
    // Parse the JSON. Clean markdown tags if the model hallucinated them
    const cleanJson = responseText.replace(/```json/g, "").replace(/```/g, "").trim();
    const parsed = JSON.parse(cleanJson);

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error("AI Generation Error:", error);
    return NextResponse.json(
      { error: "Failed to generate dynamic question." },
      { status: 500 }
    );
  }
}
