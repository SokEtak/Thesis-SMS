/**
 * Global route() helper function for Inertia.js
 * Maps route names to URLs
 */

const routes: Record<string, string | ((params?: any) => string)> = {
  // Auth routes
  'register': '/register',
  'login': '/login',
  'logout': '/logout',
  
  // Users routes
  'users.index': '/users',
  'users.create': '/users/create',
  'users.store': '/users',
  'users.show': (params) => `/users/${params?.id}`,
  'users.edit': (params) => `/users/${params?.id}/edit`,
  'users.update': (params) => `/users/${params?.id}`,
  'users.destroy': (params) => `/users/${params?.id}`,
  'users.trashed': '/users/trashed',
  'users.restore': (params) => `/users/${params?.id}/restore`,
  'users.forceDelete': (params) => `/users/${params?.id}/force-delete`,

  // Classrooms routes
  'classrooms.index': '/classrooms',
  'classrooms.create': '/classrooms/create',
  'classrooms.store': '/classrooms',
  'classrooms.show': (params) => `/classrooms/${params?.id}`,
  'classrooms.edit': (params) => `/classrooms/${params?.id}/edit`,
  'classrooms.update': (params) => `/classrooms/${params?.id}`,
  'classrooms.destroy': (params) => `/classrooms/${params?.id}`,
  'classrooms.trashed': '/classrooms/trashed',
  'classrooms.restore': (params) => `/classrooms/${params?.id}/restore`,
  'classrooms.forceDelete': (params) => `/classrooms/${params?.id}/force-delete`,

  // Subjects routes
  'subjects.index': '/subjects',
  'subjects.create': '/subjects/create',
  'subjects.store': '/subjects',
  'subjects.show': (params) => `/subjects/${params?.id}`,
  'subjects.edit': (params) => `/subjects/${params?.id}/edit`,
  'subjects.update': (params) => `/subjects/${params?.id}`,
  'subjects.destroy': (params) => `/subjects/${params?.id}`,
  'subjects.trashed': '/subjects/trashed',
  'subjects.restore': (params) => `/subjects/${params?.id}/restore`,
  'subjects.forceDelete': (params) => `/subjects/${params?.id}/force-delete`,

  // Attendances routes
  'attendances.index': '/attendances',
  'attendances.create': '/attendances/create',
  'attendances.store': '/attendances',
  'attendances.show': (params) => `/attendances/${params?.id}`,
  'attendances.edit': (params) => `/attendances/${params?.id}/edit`,
  'attendances.update': (params) => `/attendances/${params?.id}`,
  'attendances.destroy': (params) => `/attendances/${params?.id}`,
  'attendances.trashed': '/attendances/trashed',
  'attendances.restore': (params) => `/attendances/${params?.id}/restore`,
  'attendances.forceDelete': (params) => `/attendances/${params?.id}/force-delete`,

  // ExamResults routes
  'exam-results.index': '/exam-results',
  'exam-results.create': '/exam-results/create',
  'exam-results.store': '/exam-results',
  'exam-results.show': (params) => `/exam-results/${params?.id}`,
  'exam-results.edit': (params) => `/exam-results/${params?.id}/edit`,
  'exam-results.update': (params) => `/exam-results/${params?.id}`,
  'exam-results.destroy': (params) => `/exam-results/${params?.id}`,
  'exam-results.trashed': '/exam-results/trashed',
  'exam-results.restore': (params) => `/exam-results/${params?.id}/restore`,
  'exam-results.forceDelete': (params) => `/exam-results/${params?.id}/force-delete`,

  // Homeworks routes
  'homeworks.index': '/homeworks',
  'homeworks.create': '/homeworks/create',
  'homeworks.store': '/homeworks',
  'homeworks.show': (params) => `/homeworks/${params?.id}`,
  'homeworks.edit': (params) => `/homeworks/${params?.id}/edit`,
  'homeworks.update': (params) => `/homeworks/${params?.id}`,
  'homeworks.destroy': (params) => `/homeworks/${params?.id}`,
  'homeworks.trashed': '/homeworks/trashed',
  'homeworks.restore': (params) => `/homeworks/${params?.id}/restore`,
  'homeworks.forceDelete': (params) => `/homeworks/${params?.id}/force-delete`,

  // HomeworkSubmissions routes
  'homework-submissions.index': '/homework-submissions',
  'homework-submissions.create': '/homework-submissions/create',
  'homework-submissions.store': '/homework-submissions',
  'homework-submissions.show': (params) => `/homework-submissions/${params?.id}`,
  'homework-submissions.edit': (params) => `/homework-submissions/${params?.id}/edit`,
  'homework-submissions.update': (params) => `/homework-submissions/${params?.id}`,
  'homework-submissions.destroy': (params) => `/homework-submissions/${params?.id}`,
  'homework-submissions.trashed': '/homework-submissions/trashed',
  'homework-submissions.restore': (params) => `/homework-submissions/${params?.id}/restore`,
  'homework-submissions.forceDelete': (params) => `/homework-submissions/${params?.id}/force-delete`,

  // LeaveRequests routes
  'leave-requests.index': '/leave-requests',
  'leave-requests.create': '/leave-requests/create',
  'leave-requests.store': '/leave-requests',
  'leave-requests.show': (params) => `/leave-requests/${params?.id}`,
  'leave-requests.edit': (params) => `/leave-requests/${params?.id}/edit`,
  'leave-requests.update': (params) => `/leave-requests/${params?.id}`,
  'leave-requests.destroy': (params) => `/leave-requests/${params?.id}`,
  'leave-requests.trashed': '/leave-requests/trashed',
  'leave-requests.restore': (params) => `/leave-requests/${params?.id}/restore`,
  'leave-requests.forceDelete': (params) => `/leave-requests/${params?.id}/force-delete`,

  // Messages routes
  'messages.index': '/messages',
  'messages.create': '/messages/create',
  'messages.store': '/messages',
  'messages.show': (params) => `/messages/${params?.id}`,
  'messages.edit': (params) => `/messages/${params?.id}/edit`,
  'messages.update': (params) => `/messages/${params?.id}`,
  'messages.destroy': (params) => `/messages/${params?.id}`,
  'messages.trashed': '/messages/trashed',
  'messages.restore': (params) => `/messages/${params?.id}/restore`,
  'messages.forceDelete': (params) => `/messages/${params?.id}/force-delete`,

  // Timetables routes
  'timetables.index': '/timetables',
  'timetables.create': '/timetables/create',
  'timetables.store': '/timetables',
  'timetables.show': (params) => `/timetables/${params?.id}`,
  'timetables.edit': (params) => `/timetables/${params?.id}/edit`,
  'timetables.update': (params) => `/timetables/${params?.id}`,
  'timetables.destroy': (params) => `/timetables/${params?.id}`,
  'timetables.trashed': '/timetables/trashed',
  'timetables.restore': (params) => `/timetables/${params?.id}/restore`,
  'timetables.forceDelete': (params) => `/timetables/${params?.id}/force-delete`,
};

export function route(name: string, params?: any): string {
  const routeValue = routes[name];

  if (!routeValue) {
    console.warn(`Route "${name}" not found`);
    return '/';
  }

  if (typeof routeValue === 'function') {
    return routeValue(params);
  }

  return routeValue;
}

// Make route available globally
(globalThis as any).route = route;
