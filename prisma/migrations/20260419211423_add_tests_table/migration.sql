-- CreateTable
CREATE TABLE "tests" (
    "id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "prompt" TEXT NOT NULL,
    "mcq_count" INTEGER NOT NULL,
    "para_count" INTEGER NOT NULL,
    "questions" JSONB NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'draft',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "tests_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "tests" ADD CONSTRAINT "tests_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
