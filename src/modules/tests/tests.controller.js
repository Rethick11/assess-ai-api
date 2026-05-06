import { generateQuestions, saveGeneratedTest ,  fetchTeacherTests} from "./tests.service.js";
import {prisma} from "../../config/prisma.js";
 
export async function generateTest(req, res) {
  try {
    const { mcq, paragraph, prompt } = req.body;

    if (!mcq || !paragraph || !prompt) {
      return res.status(400).json({ error: "mcq, paragraph and prompt are required." });
    }

    const questions = await generateQuestions({ mcq, paragraph, prompt });
    return res.json({ questions });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}

export async function saveTest(req, res) {
  try {
    const { prompt, mcqCount, paraCount, questions } = req.body;

    // get teacher's db id from uid
    const teacher = await prisma.user.findUnique({
      where: { uid: req.user.uid },
    });

    const test = await saveGeneratedTest({
      teacherId: teacher.id,
      prompt,
      mcqCount,
      paraCount,
      questions,
    });

    return res.status(201).json({ message: "Test saved successfully.", test });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
}



export async function getTeacherTests(req, res) {
  try {
    const teacher = await prisma.user.findUnique({
      where: { uid: req.user.uid },
    });
    const tests = await fetchTeacherTests(teacher.id);
    return res.json({ tests });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}


export async function getTestById(req, res) {
  try {
    const test = await prisma.test.findUnique({
      where: { id: req.params.testId },
    });
    if (!test) return res.status(404).json({ error: "Test not found." });
    return res.json({ test });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}