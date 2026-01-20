<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('leave_requests', function (Blueprint $table) {
            $table->id();

            // Student (must be a student user)
            $table->foreignId('student_id')
                ->constrained('users')
                ->cascadeOnDelete();

            // Leave period
            $table->date('start_date');
            $table->date('end_date');

            // Optional reason
            $table->text('reason')->nullable();

            // Status
            $table->enum('status', [
                'Pending',
                'Approved',
                'Rejected',
                'Cancelled'
            ])->default('Pending');

            // Approval
            $table->foreignId('approved_by')
                ->nullable()
                ->constrained('users')
                ->nullOnDelete();

            $table->timestamp('approved_at')->nullable();

            // Audit
            $table->timestamps();
            $table->softDeletes();

            // Performance
            $table->index(['student_id', 'status']);
            $table->index(['start_date', 'end_date']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('leave_requests');
    }
};
