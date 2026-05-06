import {prisma} from "../../config/prisma.js";

import { gradeSubmission } from "./grading.service.js";

export async function saveSubmission(req, res) {
  try {
    const { testId, studentUid, answers } = req.body;

    const student = await prisma.user.findUnique({ where: { uid: studentUid } });
    if (!student) return res.status(404).json({ error: "Student not found." });

    const test = await prisma.test.findUnique({ where: { id: testId } });
    if (!test) return res.status(404).json({ error: "Test not found." });

    const submission = await prisma.submission.create({
      data: {
        student_id:     student.id,
        test_id:        testId,
        answers,
        grading_status: "pending",
      },
    });

    // Auto trigger grading in background — don't await so response is instant
    gradeSubmission(submission.id)
      .then((result) => {
        console.log(`[grading] Done for submission ${submission.id}`);
      })
      .catch((err) => {
        console.error(`[grading] Failed for submission ${submission.id}`, err);
      });

    return res.status(201).json({ submission });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

export async function gradeSubmissionHandler(req, res) {
  try {
    const { submissionId } = req.params;
    const result = await gradeSubmission(submissionId);
    return res.json({ message: "Grading complete.", result });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

export async function getSubmissionResult(req, res) {
  try {
    const { submissionId } = req.params;
    const submission = await prisma.submission.findUnique({
      where: { id: submissionId },
      include: { student: true, test: true },
    });
    if (!submission) return res.status(404).json({ error: "Submission not found." });
    return res.json({ submission });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}