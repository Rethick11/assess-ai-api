import Anthropic from "@anthropic-ai/sdk";
import fs from "fs";
import path from "path";
import { prisma } from "../../config/prisma.js";
import axios from "axios";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function gradeSubmission(submissionId) {
  const submission = await prisma.submission.findUnique({
    where: { id: submissionId },
    include: { test: true, student: true },
  });

  if (!submission) throw new Error("Submission not found.");

  const questions = submission.test.questions;
  const answers   = submission.answers;

  // ── MCQ GRADING (exact match)
  let mcqScore = 0;
  const mcqResults = [];

  questions.mcq.forEach((q, i) => {
    const studentAnswer = answers.mcq[i];
    const correct       = studentAnswer === q.correct_option;
    if (correct) mcqScore++;
    mcqResults.push({
      question:       q.question,
      student_answer: q.options[studentAnswer] ?? "No answer",
      correct_answer: q.options[q.correct_option],
      correct,
    });
  });

  // ── PARAGRAPH GRADING (Claude)
  let paraScore = 0;
  const paraResults = [];

  for (let i = 0; i < questions.paragraph.length; i++) {
    const q      = questions.paragraph[i];
    const answer = answers.paragraph[i] || "No answer provided.";

    // Fallback if rubric is missing (old tests created before rubric was added)
    const rubric    = q.rubric || { key_points: ["Correct and relevant answer"], max_score: 10 };
    const maxScore  = rubric.max_score || 10;
    const keyPoints = rubric.key_points || ["Correct and relevant answer"];

    const response = await client.messages.create({
      model:      "claude-sonnet-4-5",
      max_tokens: 500,
      messages: [
        {
          role:    "user",
          content: `You are an exam grader. Grade the following student answer.

Question: ${q.question}

Rubric key points (each worth equal marks, total ${maxScore} marks):
${keyPoints.map((p, i) => `${i + 1}. ${p}`).join("\n")}

Student Answer: ${answer}

Return ONLY raw JSON, no markdown:
{
  "score": <number out of ${maxScore}>,
  "feedback": "<brief feedback explaining the score>",
  "key_points_covered": [<true/false for each key point>],
  "confidence": <0.0 to 1.0>
}`,
        },
      ],
    });

    const raw     = response.content[0].text.replace(/```json|```/g, "").trim();
    const grading = JSON.parse(raw);

    paraScore += grading.score;
    paraResults.push({
      question:           q.question,
      student_answer:     answer,
      score:              grading.score,
      max_score:          maxScore,
      feedback:           grading.feedback,
      key_points_covered: grading.key_points_covered,
      confidence:         grading.confidence,
    });
  }

  // ── TOTAL SCORE
  const totalMcqMax  = questions.mcq.length;
  const totalParaMax = questions.paragraph.reduce((sum, q) => {
    return sum + (q.rubric?.max_score || 10);
  }, 0);
  const totalMax   = totalMcqMax + totalParaMax;
  const totalScore = mcqScore + paraScore;

  // ── SAVE TO DB
  await prisma.submission.update({
    where: { id: submissionId },
    data: {
      ai_grade:       totalScore,
      ai_feedback:    JSON.stringify(paraResults),
      grading_status: "ai_graded",
      graded_at:      new Date(),
    },
  });

  // ── NOTIFY ROOM SERVER
  try {
    await axios.post(
      `${process.env.ROOM_SERVER_URL}/internal/grading-complete`,
      {
        submissionId,
        studentUid: submission.student.uid,
        totalScore,
        totalMax,
      },
      { headers: { "x-internal-secret": process.env.INTERNAL_SECRET } }
    );
  } catch (err) {
    console.error("[grading] Failed to notify room server:", err.message);
  }

  // ── WRITE TO TXT FILE
  const report = generateReport({
    student: submission.student,
    mcqScore,
    totalMcqMax,
    paraScore,
    totalParaMax,
    totalScore,
    totalMax,
    mcqResults,
    paraResults,
  });

  const dir = path.resolve("reports");
  if (!fs.existsSync(dir)) fs.mkdirSync(dir);

  const filename = `${dir}/report_${submissionId}.txt`;
  fs.writeFileSync(filename, report);

  console.log(`[grading] Report saved to ${filename}`);

  return { totalScore, totalMax, mcqScore, paraScore, mcqResults, paraResults };
}

function generateReport({ student, mcqScore, totalMcqMax, paraScore, totalParaMax, totalScore, totalMax, mcqResults, paraResults }) {
  const lines = [];

  lines.push("=".repeat(60));
  lines.push("ASSESSMENT REPORT — AssessAI");
  lines.push("=".repeat(60));
  lines.push(`Student : ${student.name}`);
  lines.push(`Email   : ${student.email}`);
  lines.push(`Date    : ${new Date().toLocaleString()}`);
  lines.push("-".repeat(60));
  lines.push(`TOTAL SCORE : ${totalScore} / ${totalMax}`);
  lines.push(`MCQ Score   : ${mcqScore} / ${totalMcqMax}`);
  lines.push(`Para Score  : ${paraScore} / ${totalParaMax}`);
  lines.push("=".repeat(60));

  lines.push("\nSECTION A — MCQ RESULTS\n");
  mcqResults.forEach((r, i) => {
    lines.push(`Q${i + 1}. ${r.question}`);
    lines.push(`   Student Answer : ${r.student_answer}`);
    lines.push(`   Correct Answer : ${r.correct_answer}`);
    lines.push(`   Result         : ${r.correct ? "✓ Correct" : "✗ Wrong"}`);
    lines.push("");
  });

  lines.push("=".repeat(60));
  lines.push("\nSECTION B — PARAGRAPH RESULTS\n");
  paraResults.forEach((r, i) => {
    lines.push(`Q${i + 1}. ${r.question}`);
    lines.push(`   Student Answer : ${r.student_answer}`);
    lines.push(`   Score          : ${r.score} / ${r.max_score}`);
    lines.push(`   Feedback       : ${r.feedback}`);
    lines.push(`   AI Confidence  : ${(r.confidence * 100).toFixed(0)}%`);
    lines.push("");
  });

  lines.push("=".repeat(60));
  lines.push("END OF REPORT");
  lines.push("=".repeat(60));

  return lines.join("\n");
}