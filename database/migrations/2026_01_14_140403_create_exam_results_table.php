<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('exam_results', function (Blueprint $table) {
            $table->id();

            // Relations
            $table->foreignId('student_id')
                ->constrained('users')
                ->cascadeOnDelete();

            $table->foreignId('subject_id')
                ->constrained('subjects')
                ->cascadeOnDelete();

            // Exam metadata
            $table->string('exam_type', 30); // quiz, monthly, semester, midterm, final

            $table->date('exam_date');

            // Score
            $table->unsignedTinyInteger('score')->nullable();
            // $table->check('score between 1 and 125');

            // Audit
            $table->foreignId('recorded_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->text('remark')->nullable();

            // Status
            $table->enum('status', ['draft', 'final'])->default('draft');

            // Indexes
            $table->unique(
                ['student_id', 'subject_id', 'exam_type', 'exam_date'],
                'unique_exam_per_student_subject'
            );

            $table->timestamps();
            $table->softDeletes();
        });

    }

    public function down(): void
    {
        Schema::dropIfExists('exam_results');
    }
};
