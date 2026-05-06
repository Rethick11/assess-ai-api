-- CreateTable
CREATE TABLE "submissions" (
    "id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "test_id" TEXT NOT NULL,
    "answers" JSONB NOT NULL,
    "ai_grade" INTEGER,
    "ai_feedback" TEXT,
    "ai_confidence" DOUBLE PRECISION,
    "human_grade" INTEGER,
    "human_feedback" TEXT,
    "is_final" BOOLEAN NOT NULL DEFAULT false,
    "grading_status" TEXT NOT NULL DEFAULT 'pending',
    "submitted_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "graded_at" TIMESTAMP(3),

    CONSTRAINT "submissions_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "submissions" ADD CONSTRAINT "submissions_test_id_fkey" FOREIGN KEY ("test_id") REFERENCES "tests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
