import Anthropic from "@anthropic-ai/sdk";
import {prisma} from "../../config/prisma.js";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function generateQuestions({ mcq, paragraph, prompt }) {
  const message = await client.messages.create({
    model: "claude-sonnet-4-5",
    max_tokens: 4096,
    messages: [
      {
        role: "user",
        content: `You are an exam paper generator. Generate exactly ${mcq} MCQ questions and ${paragraph} paragraph questions about the following topic: "${prompt}".

Return ONLY a valid JSON object in this exact format, no extra text, no markdown, no code blocks, just raw JSON:
{
  "mcq": [
    {
      "question": "question text here",
      "options": ["option A", "option B", "option C", "option D"],
      "correct_option": 0
    }
  ],
  "paragraph": [
    {
      "question": "question text here",
      "rubric": {
        "key_points": ["key point 1", "key point 2", "key point 3"],
        "max_score": 10
      }
    }
  ]
}

correct_option is the index (0-3) of the correct answer in options array. Return raw JSON only, no backticks, no markdown.`,
      },
    ],
  });

 const raw = message.content[0].text;
const cleaned = raw.replace(/```json|```/g, "").trim();
const questions = JSON.parse(cleaned);
return questions;
}

export async function saveGeneratedTest({ teacherId, prompt, mcqCount, paraCount, questions }) {
  const test = await prisma.test.create({
    data: {
      teacher_id: teacherId,
      prompt,
      mcq_count:  mcqCount,
      para_count: paraCount,
      questions,
      status: "draft",
    },
  });
  return test;
}


export async function fetchTeacherTests(teacherId) {
  const tests = await prisma.test.findMany({
    where: { teacher_id: teacherId },
    orderBy: { created_at: "desc" },
  });
  return tests;
}