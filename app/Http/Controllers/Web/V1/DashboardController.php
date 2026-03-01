<?php

namespace App\Http\Controllers\Web\V1;

use App\Http\Controllers\Controller;
use App\Models\Attendance;
use App\Models\Classroom;
use App\Models\ExamResult;
use App\Models\Homework;
use App\Models\HomeworkSubmission;
use App\Models\LeaveRequest;
use App\Models\Message;
use App\Models\Subject;
use App\Models\Timetable;
use App\Models\User;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Inertia\Inertia;
use Inertia\Response;

class DashboardController extends Controller
{
    public function __invoke(Request $request): Response
    {
        $actor = $request->user();

        $users = $this->buildUsersSummary($actor?->can('viewAny', User::class) ?? false);
        $classrooms = $this->buildClassroomsSummary($actor?->can('viewAny', Classroom::class) ?? false);
        $subjects = $this->buildSubjectsSummary($actor?->can('viewAny', Subject::class) ?? false);
        $attendances = $this->buildAttendancesSummary($actor?->can('viewAny', Attendance::class) ?? false);
        $examResults = $this->buildExamResultsSummary($actor?->can('viewAny', ExamResult::class) ?? false);
        $homeworks = $this->buildHomeworksSummary($actor?->can('viewAny', Homework::class) ?? false);
        $homeworkSubmissions = $this->buildHomeworkSubmissionsSummary($actor?->can('viewAny', HomeworkSubmission::class) ?? false);
        $leaveRequests = $this->buildLeaveRequestsSummary($actor?->can('viewAny', LeaveRequest::class) ?? false);
        $messages = $this->buildMessagesSummary($actor?->can('viewAny', Message::class) ?? false);
        $timetables = $this->buildTimetablesSummary($actor?->can('viewAny', Timetable::class) ?? false);

        $resourceSummaries = [
            $users,
            $classrooms,
            $subjects,
            $attendances,
            $examResults,
            $homeworks,
            $homeworkSubmissions,
            $leaveRequests,
            $messages,
            $timetables,
        ];

        $totalRecords = array_sum(array_map(static fn (array $item): int => (int) ($item['total'] ?? 0), $resourceSummaries));
        $totalTrashed = array_sum(array_map(static fn (array $item): int => (int) ($item['trashed'] ?? 0), $resourceSummaries));
        $createdLastSevenDays = array_sum(array_map(static fn (array $item): int => (int) ($item['created_last_7_days'] ?? 0), $resourceSummaries));
        $activeRecords = max(0, $totalRecords - $totalTrashed);
        $activeRatio = $totalRecords > 0
            ? round(($activeRecords / $totalRecords) * 100, 1)
            : 0;

        return Inertia::render('dashboard', [
            'generated_at' => now()->toIso8601String(),
            'overview' => [
                'total_records' => $totalRecords,
                'active_records' => $activeRecords,
                'trashed_records' => $totalTrashed,
                'created_last_7_days' => $createdLastSevenDays,
                'active_ratio' => $activeRatio,
            ],
            'resources' => [
                'users' => $users,
                'classrooms' => $classrooms,
                'subjects' => $subjects,
                'attendances' => $attendances,
                'exam_results' => $examResults,
                'homeworks' => $homeworks,
                'homework_submissions' => $homeworkSubmissions,
                'leave_requests' => $leaveRequests,
                'messages' => $messages,
                'timetables' => $timetables,
            ],
        ]);
    }

    private function buildUsersSummary(bool $canView): array
    {
        if (! $canView) {
            return $this->emptySummary();
        }

        $total = User::query()->count();
        $trashed = User::onlyTrashed()->count();
        $createdLastSevenDays = $this->countInLastSevenDays(User::query());
        $createdPreviousSevenDays = $this->countInPreviousSevenDays(User::query());
        $studentsCount = User::query()->students()->count();
        $teachersCount = User::query()->teachers()->count();

        return [
            'can_view' => true,
            'total' => $total,
            'trashed' => $trashed,
            'created_last_7_days' => $createdLastSevenDays,
            'created_previous_7_days' => $createdPreviousSevenDays,
            'trend' => $this->resolveTrend($createdLastSevenDays, $createdPreviousSevenDays),
            'series' => $this->createdSeries(User::query()),
            'stats' => [
                'students' => $studentsCount,
                'teachers' => $teachersCount,
            ],
            'recent' => User::query()
                ->select(['id', 'name', 'email', 'created_at'])
                ->latest('created_at')
                ->limit(5)
                ->get()
                ->map(fn (User $user) => [
                    'id' => $user->id,
                    'title' => $user->name,
                    'subtitle' => $user->email,
                    'created_at' => $user->created_at?->toIso8601String(),
                ])
                ->values()
                ->all(),
        ];
    }

    private function buildClassroomsSummary(bool $canView): array
    {
        if (! $canView) {
            return $this->emptySummary();
        }

        $total = Classroom::query()->count();
        $trashed = Classroom::onlyTrashed()->count();
        $createdLastSevenDays = $this->countInLastSevenDays(Classroom::query());
        $createdPreviousSevenDays = $this->countInPreviousSevenDays(Classroom::query());
        $assignedTeacherCount = Classroom::query()->whereNotNull('teacher_in_charge_id')->count();

        return [
            'can_view' => true,
            'total' => $total,
            'trashed' => $trashed,
            'created_last_7_days' => $createdLastSevenDays,
            'created_previous_7_days' => $createdPreviousSevenDays,
            'trend' => $this->resolveTrend($createdLastSevenDays, $createdPreviousSevenDays),
            'series' => $this->createdSeries(Classroom::query()),
            'stats' => [
                'assigned_teachers' => $assignedTeacherCount,
                'without_teacher' => max(0, $total - $assignedTeacherCount),
            ],
            'recent' => Classroom::query()
                ->with('teacherInCharge:id,name')
                ->select(['id', 'name', 'teacher_in_charge_id', 'created_at'])
                ->latest('created_at')
                ->limit(5)
                ->get()
                ->map(fn (Classroom $classroom) => [
                    'id' => $classroom->id,
                    'title' => $classroom->name,
                    'subtitle' => $classroom->teacherInCharge?->name
                        ? 'Teacher: '.$classroom->teacherInCharge->name
                        : 'No teacher assigned',
                    'created_at' => $classroom->created_at?->toIso8601String(),
                ])
                ->values()
                ->all(),
        ];
    }

    private function buildSubjectsSummary(bool $canView): array
    {
        if (! $canView) {
            return $this->emptySummary();
        }

        $total = Subject::query()->count();
        $trashed = Subject::onlyTrashed()->count();
        $createdLastSevenDays = $this->countInLastSevenDays(Subject::query());
        $createdPreviousSevenDays = $this->countInPreviousSevenDays(Subject::query());
        $withCodeCount = Subject::query()
            ->whereNotNull('code')
            ->where('code', '<>', '')
            ->count();

        return [
            'can_view' => true,
            'total' => $total,
            'trashed' => $trashed,
            'created_last_7_days' => $createdLastSevenDays,
            'created_previous_7_days' => $createdPreviousSevenDays,
            'trend' => $this->resolveTrend($createdLastSevenDays, $createdPreviousSevenDays),
            'series' => $this->createdSeries(Subject::query()),
            'stats' => [
                'with_code' => $withCodeCount,
                'without_code' => max(0, $total - $withCodeCount),
            ],
            'recent' => Subject::query()
                ->select(['id', 'name', 'code', 'created_at'])
                ->latest('created_at')
                ->limit(5)
                ->get()
                ->map(fn (Subject $subject) => [
                    'id' => $subject->id,
                    'title' => $subject->name,
                    'subtitle' => $subject->code ? 'Code: '.$subject->code : 'No code',
                    'created_at' => $subject->created_at?->toIso8601String(),
                ])
                ->values()
                ->all(),
        ];
    }

    private function buildAttendancesSummary(bool $canView): array
    {
        if (! $canView) {
            return $this->emptySummary();
        }

        $total = Attendance::query()->count();
        $trashed = Attendance::onlyTrashed()->count();
        $createdLastSevenDays = $this->countInLastSevenDays(Attendance::query());
        $createdPreviousSevenDays = $this->countInPreviousSevenDays(Attendance::query());
        $presentCount = Attendance::query()->where('status', 'pre')->count();
        $absentCount = Attendance::query()->where('status', 'a')->count();
        $lateCount = Attendance::query()->where('status', 'l')->count();

        return [
            'can_view' => true,
            'total' => $total,
            'trashed' => $trashed,
            'created_last_7_days' => $createdLastSevenDays,
            'created_previous_7_days' => $createdPreviousSevenDays,
            'trend' => $this->resolveTrend($createdLastSevenDays, $createdPreviousSevenDays),
            'series' => $this->createdSeries(Attendance::query()),
            'stats' => [
                'present' => $presentCount,
                'absent' => $absentCount,
                'late' => $lateCount,
            ],
            'recent' => Attendance::query()
                ->with(['student:id,name', 'classroom:id,name'])
                ->select(['id', 'student_id', 'class_id', 'date', 'status', 'created_at'])
                ->latest('created_at')
                ->limit(5)
                ->get()
                ->map(fn (Attendance $attendance) => [
                    'id' => $attendance->id,
                    'title' => ($attendance->student?->name ?? 'Unknown Student').' - '.($attendance->classroom?->name ?? 'Unknown Class'),
                    'subtitle' => ($attendance->date?->toDateString() ?? '-').' - '.$this->statusLabel($attendance->status),
                    'created_at' => $attendance->created_at?->toIso8601String(),
                ])
                ->values()
                ->all(),
        ];
    }

    private function buildExamResultsSummary(bool $canView): array
    {
        if (! $canView) {
            return $this->emptySummary();
        }

        $total = ExamResult::query()->count();
        $trashed = ExamResult::onlyTrashed()->count();
        $createdLastSevenDays = $this->countInLastSevenDays(ExamResult::query());
        $createdPreviousSevenDays = $this->countInPreviousSevenDays(ExamResult::query());
        $finalCount = ExamResult::query()->where('status', 'final')->count();
        $draftCount = ExamResult::query()->where('status', 'draft')->count();
        $averageScore = (float) (ExamResult::query()->avg('score') ?? 0);

        return [
            'can_view' => true,
            'total' => $total,
            'trashed' => $trashed,
            'created_last_7_days' => $createdLastSevenDays,
            'created_previous_7_days' => $createdPreviousSevenDays,
            'trend' => $this->resolveTrend($createdLastSevenDays, $createdPreviousSevenDays),
            'series' => $this->createdSeries(ExamResult::query()),
            'stats' => [
                'final' => $finalCount,
                'draft' => $draftCount,
                'average_score' => (int) round($averageScore),
            ],
            'recent' => ExamResult::query()
                ->with(['student:id,name', 'subject:id,name'])
                ->select(['id', 'student_id', 'subject_id', 'exam_type', 'score', 'created_at'])
                ->latest('created_at')
                ->limit(5)
                ->get()
                ->map(fn (ExamResult $examResult) => [
                    'id' => $examResult->id,
                    'title' => ($examResult->student?->name ?? 'Unknown Student').' - '.($examResult->subject?->name ?? 'Unknown Subject'),
                    'subtitle' => ($examResult->exam_type ?? '-').' - Score: '.($examResult->score ?? '-'),
                    'created_at' => $examResult->created_at?->toIso8601String(),
                ])
                ->values()
                ->all(),
        ];
    }

    private function buildHomeworksSummary(bool $canView): array
    {
        if (! $canView) {
            return $this->emptySummary();
        }

        $total = Homework::query()->count();
        $trashed = Homework::onlyTrashed()->count();
        $createdLastSevenDays = $this->countInLastSevenDays(Homework::query());
        $createdPreviousSevenDays = $this->countInPreviousSevenDays(Homework::query());
        $withDeadline = Homework::query()->whereNotNull('deadline')->count();

        return [
            'can_view' => true,
            'total' => $total,
            'trashed' => $trashed,
            'created_last_7_days' => $createdLastSevenDays,
            'created_previous_7_days' => $createdPreviousSevenDays,
            'trend' => $this->resolveTrend($createdLastSevenDays, $createdPreviousSevenDays),
            'series' => $this->createdSeries(Homework::query()),
            'stats' => [
                'with_deadline' => $withDeadline,
                'without_deadline' => max(0, $total - $withDeadline),
            ],
            'recent' => Homework::query()
                ->with(['classroom:id,name', 'subject:id,name'])
                ->select(['id', 'title', 'class_id', 'subject_id', 'deadline', 'created_at'])
                ->latest('created_at')
                ->limit(5)
                ->get()
                ->map(fn (Homework $homework) => [
                    'id' => $homework->id,
                    'title' => $homework->title ?? 'Untitled Homework',
                    'subtitle' => ($homework->classroom?->name ?? 'Unknown Class').' - '.($homework->subject?->name ?? 'Unknown Subject'),
                    'created_at' => $homework->created_at?->toIso8601String(),
                ])
                ->values()
                ->all(),
        ];
    }

    private function buildHomeworkSubmissionsSummary(bool $canView): array
    {
        if (! $canView) {
            return $this->emptySummary();
        }

        $total = HomeworkSubmission::query()->count();
        $trashed = HomeworkSubmission::onlyTrashed()->count();
        $createdLastSevenDays = $this->countInLastSevenDays(HomeworkSubmission::query());
        $createdPreviousSevenDays = $this->countInPreviousSevenDays(HomeworkSubmission::query());
        $scored = HomeworkSubmission::query()->whereNotNull('score')->count();

        return [
            'can_view' => true,
            'total' => $total,
            'trashed' => $trashed,
            'created_last_7_days' => $createdLastSevenDays,
            'created_previous_7_days' => $createdPreviousSevenDays,
            'trend' => $this->resolveTrend($createdLastSevenDays, $createdPreviousSevenDays),
            'series' => $this->createdSeries(HomeworkSubmission::query()),
            'stats' => [
                'scored' => $scored,
                'unscored' => max(0, $total - $scored),
            ],
            'recent' => HomeworkSubmission::query()
                ->with(['homework:id,title', 'student:id,name'])
                ->select(['id', 'homework_id', 'student_id', 'submitted_at', 'score', 'created_at'])
                ->latest('created_at')
                ->limit(5)
                ->get()
                ->map(fn (HomeworkSubmission $submission) => [
                    'id' => $submission->id,
                    'title' => ($submission->student?->name ?? 'Unknown Student').' - '.($submission->homework?->title ?? 'Unknown Homework'),
                    'subtitle' => 'Score: '.($submission->score ?? '-'),
                    'created_at' => $submission->created_at?->toIso8601String(),
                ])
                ->values()
                ->all(),
        ];
    }

    private function buildLeaveRequestsSummary(bool $canView): array
    {
        if (! $canView) {
            return $this->emptySummary();
        }

        $total = LeaveRequest::query()->count();
        $trashed = LeaveRequest::onlyTrashed()->count();
        $createdLastSevenDays = $this->countInLastSevenDays(LeaveRequest::query());
        $createdPreviousSevenDays = $this->countInPreviousSevenDays(LeaveRequest::query());
        $approved = LeaveRequest::query()->where('status', 'Approved')->count();
        $pending = LeaveRequest::query()->where('status', 'Pending')->count();
        $rejected = LeaveRequest::query()->where('status', 'Rejected')->count();

        return [
            'can_view' => true,
            'total' => $total,
            'trashed' => $trashed,
            'created_last_7_days' => $createdLastSevenDays,
            'created_previous_7_days' => $createdPreviousSevenDays,
            'trend' => $this->resolveTrend($createdLastSevenDays, $createdPreviousSevenDays),
            'series' => $this->createdSeries(LeaveRequest::query()),
            'stats' => [
                'approved' => $approved,
                'pending' => $pending,
                'rejected' => $rejected,
            ],
            'recent' => LeaveRequest::query()
                ->with(['student:id,name'])
                ->select(['id', 'student_id', 'start_date', 'end_date', 'status', 'created_at'])
                ->latest('created_at')
                ->limit(5)
                ->get()
                ->map(fn (LeaveRequest $leaveRequest) => [
                    'id' => $leaveRequest->id,
                    'title' => ($leaveRequest->student?->name ?? 'Unknown Student').' - '.($leaveRequest->status ?? '-'),
                    'subtitle' => ($leaveRequest->start_date?->toDateString() ?? '-').' to '.($leaveRequest->end_date?->toDateString() ?? '-'),
                    'created_at' => $leaveRequest->created_at?->toIso8601String(),
                ])
                ->values()
                ->all(),
        ];
    }

    private function buildMessagesSummary(bool $canView): array
    {
        if (! $canView) {
            return $this->emptySummary();
        }

        $total = Message::query()->count();
        $trashed = Message::onlyTrashed()->count();
        $createdLastSevenDays = $this->countInLastSevenDays(Message::query());
        $createdPreviousSevenDays = $this->countInPreviousSevenDays(Message::query());
        $read = Message::query()->where('is_read', true)->count();

        return [
            'can_view' => true,
            'total' => $total,
            'trashed' => $trashed,
            'created_last_7_days' => $createdLastSevenDays,
            'created_previous_7_days' => $createdPreviousSevenDays,
            'trend' => $this->resolveTrend($createdLastSevenDays, $createdPreviousSevenDays),
            'series' => $this->createdSeries(Message::query()),
            'stats' => [
                'read' => $read,
                'unread' => max(0, $total - $read),
            ],
            'recent' => Message::query()
                ->with(['sender:id,name', 'receiver:id,name'])
                ->select(['id', 'sender_id', 'receiver_id', 'message_body', 'is_read', 'created_at'])
                ->latest('created_at')
                ->limit(5)
                ->get()
                ->map(fn (Message $message) => [
                    'id' => $message->id,
                    'title' => ($message->sender?->name ?? 'Unknown Sender').' -> '.($message->receiver?->name ?? 'Unknown Receiver'),
                    'subtitle' => ($message->is_read ? 'Read' : 'Unread').' - '.str((string) ($message->message_body ?? ''))->limit(48)->value(),
                    'created_at' => $message->created_at?->toIso8601String(),
                ])
                ->values()
                ->all(),
        ];
    }

    private function buildTimetablesSummary(bool $canView): array
    {
        if (! $canView) {
            return $this->emptySummary();
        }

        $total = Timetable::query()->count();
        $trashed = Timetable::onlyTrashed()->count();
        $createdLastSevenDays = $this->countInLastSevenDays(Timetable::query());
        $createdPreviousSevenDays = $this->countInPreviousSevenDays(Timetable::query());
        $weekdays = Timetable::query()->whereIn('day_of_week', ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'])->count();

        return [
            'can_view' => true,
            'total' => $total,
            'trashed' => $trashed,
            'created_last_7_days' => $createdLastSevenDays,
            'created_previous_7_days' => $createdPreviousSevenDays,
            'trend' => $this->resolveTrend($createdLastSevenDays, $createdPreviousSevenDays),
            'series' => $this->createdSeries(Timetable::query()),
            'stats' => [
                'weekdays' => $weekdays,
                'weekend' => max(0, $total - $weekdays),
            ],
            'recent' => Timetable::query()
                ->with(['classroom:id,name', 'subject:id,name'])
                ->select(['id', 'class_id', 'subject_id', 'day_of_week', 'start_time', 'created_at'])
                ->latest('created_at')
                ->limit(5)
                ->get()
                ->map(fn (Timetable $timetable) => [
                    'id' => $timetable->id,
                    'title' => ($timetable->classroom?->name ?? 'Unknown Class').' - '.($timetable->subject?->name ?? 'Unknown Subject'),
                    'subtitle' => ($timetable->day_of_week ?? '-').' - '.($timetable->start_time ?? '-'),
                    'created_at' => $timetable->created_at?->toIso8601String(),
                ])
                ->values()
                ->all(),
        ];
    }

    private function countInLastSevenDays(Builder $query): int
    {
        return (int) (clone $query)
            ->where('created_at', '>=', now()->startOfDay()->subDays(6))
            ->count();
    }

    private function countInPreviousSevenDays(Builder $query): int
    {
        $startOfCurrentWindow = now()->startOfDay()->subDays(6);
        $startOfPreviousWindow = (clone $startOfCurrentWindow)->subDays(7);
        $endOfPreviousWindow = (clone $startOfCurrentWindow)->subSecond();

        return (int) (clone $query)
            ->whereBetween('created_at', [$startOfPreviousWindow, $endOfPreviousWindow])
            ->count();
    }

    private function createdSeries(Builder $query, int $days = 7): array
    {
        $startDate = now()->startOfDay()->subDays($days - 1);
        $raw = (clone $query)
            ->selectRaw('DATE(created_at) as created_date, COUNT(*) as aggregate_count')
            ->where('created_at', '>=', $startDate)
            ->groupBy('created_date')
            ->pluck('aggregate_count', 'created_date');

        $series = [];

        for ($day = 0; $day < $days; $day++) {
            $date = (clone $startDate)->addDays($day);
            $key = $date->toDateString();
            $series[] = [
                'date' => $key,
                'label' => $date->format('D'),
                'value' => (int) ($raw[$key] ?? 0),
            ];
        }

        return $series;
    }

    private function resolveTrend(int $current, int $previous): array
    {
        if ($previous === 0) {
            if ($current === 0) {
                return [
                    'direction' => 'flat',
                    'percent' => 0,
                ];
            }

            return [
                'direction' => 'up',
                'percent' => 100,
            ];
        }

        $delta = $current - $previous;
        $percent = round((abs($delta) / $previous) * 100, 1);

        return [
            'direction' => $delta === 0 ? 'flat' : ($delta > 0 ? 'up' : 'down'),
            'percent' => $percent,
        ];
    }

    private function emptySummary(): array
    {
        return [
            'can_view' => false,
            'total' => 0,
            'trashed' => 0,
            'created_last_7_days' => 0,
            'created_previous_7_days' => 0,
            'trend' => [
                'direction' => 'flat',
                'percent' => 0,
            ],
            'series' => $this->emptySeries(),
            'stats' => [],
            'recent' => [],
        ];
    }

    private function emptySeries(int $days = 7): array
    {
        return collect(range(0, $days - 1))
            ->map(function (int $offset) use ($days): array {
                $date = Carbon::now()->startOfDay()->subDays($days - 1 - $offset);

                return [
                    'date' => $date->toDateString(),
                    'label' => $date->format('D'),
                    'value' => 0,
                ];
            })
            ->all();
    }

    private function statusLabel(?string $status): string
    {
        return match ($status) {
            'pre' => 'Present',
            'a' => 'Absent',
            'per' => 'Permission',
            'l' => 'Late',
            default => '-',
        };
    }
}
