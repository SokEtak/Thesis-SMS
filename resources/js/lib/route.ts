/**
 * Global route() helper function for Inertia.js
 * Maps route names to URLs
 */

type RouteParamValue = string | number | boolean | null | undefined;
type RouteParamRecord = Record<string, RouteParamValue | RouteParamValue[]>;

const isRouteParamRecord = (value: unknown): value is RouteParamRecord =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const resolveId = (params?: unknown): unknown =>
  isRouteParamRecord(params) ? params.id : params;

const appendQuery = (url: string, params?: unknown): string => {
  if (!isRouteParamRecord(params)) {
    return url;
  }

  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') {
      return;
    }

    if (Array.isArray(value)) {
      value.forEach((item) => searchParams.append(key, String(item)));
      return;
    }

    searchParams.append(key, String(value));
  });

  const queryString = searchParams.toString();
  if (!queryString) {
    return url;
  }

  return `${url}${url.includes('?') ? '&' : '?'}${queryString}`;
};

const routes: Record<string, string | ((params?: unknown) => string)> = {
  // Auth routes
  'register': '/register',
  'login': '/login',
  'logout': '/logout',
  
  // Users routes
  'users.index': '/users',
  'users.create': '/users/create',
  'users.store': '/users',
  'users.show': (params) => `/users/${resolveId(params)}`,
  'users.edit': (params) => `/users/${resolveId(params)}/edit`,
  'users.update': (params) => `/users/${resolveId(params)}`,
  'users.destroy': (params) => `/users/${resolveId(params)}`,
  'users.trashed': '/users/trashed',
  'users.restore': (params) => `/users/${resolveId(params)}/restore`,
  'users.forceDelete': (params) => `/users/${resolveId(params)}/force`,

  // Classrooms routes
  'classrooms.index': '/classrooms',
  'classrooms.create': '/classrooms/create',
  'classrooms.store': '/classrooms',
  'classrooms.show': (params) => `/classrooms/${resolveId(params)}`,
  'classrooms.edit': (params) => `/classrooms/${resolveId(params)}/edit`,
  'classrooms.update': (params) => `/classrooms/${resolveId(params)}`,
  'classrooms.destroy': (params) => `/classrooms/${resolveId(params)}`,
  'classrooms.trashed': '/classrooms/trashed',
  'classrooms.restore': (params) => `/classrooms/${resolveId(params)}/restore`,
  'classrooms.forceDelete': (params) => `/classrooms/${resolveId(params)}/force`,
  'classrooms.batchStore': '/classrooms/batch-store',
  'classrooms.batchAssignTeacher': '/classrooms/batch-assign-teacher',
  'classrooms.batchDestroy': '/classrooms/batch-delete',
  'classrooms.import': '/classrooms/import',
  'classrooms.export.csv': '/classrooms/export/csv',
  'classrooms.suggestions': '/classrooms/suggestions',

  // Subjects routes
  'subjects.index': '/subjects',
  'subjects.create': '/subjects/create',
  'subjects.store': '/subjects',
  'subjects.show': (params) => `/subjects/${resolveId(params)}`,
  'subjects.edit': (params) => `/subjects/${resolveId(params)}/edit`,
  'subjects.update': (params) => `/subjects/${resolveId(params)}`,
  'subjects.destroy': (params) => `/subjects/${resolveId(params)}`,
  'subjects.trashed': '/subjects/trashed',
  'subjects.restore': (params) => `/subjects/${resolveId(params)}/restore`,
  'subjects.forceDelete': (params) => `/subjects/${resolveId(params)}/force-delete`,

  // Attendances routes
  'attendances.index': '/attendances',
  'attendances.create': '/attendances/create',
  'attendances.store': '/attendances',
  'attendances.show': (params) => `/attendances/${resolveId(params)}`,
  'attendances.edit': (params) => `/attendances/${resolveId(params)}/edit`,
  'attendances.update': (params) => `/attendances/${resolveId(params)}`,
  'attendances.destroy': (params) => `/attendances/${resolveId(params)}`,
  'attendances.trashed': '/attendances/trashed',
  'attendances.restore': (params) => `/attendances/${resolveId(params)}/restore`,
  'attendances.forceDelete': (params) => `/attendances/${resolveId(params)}/force-delete`,

  // ExamResults routes
  'exam-results.index': '/exam-results',
  'exam-results.create': '/exam-results/create',
  'exam-results.store': '/exam-results',
  'exam-results.show': (params) => `/exam-results/${resolveId(params)}`,
  'exam-results.edit': (params) => `/exam-results/${resolveId(params)}/edit`,
  'exam-results.update': (params) => `/exam-results/${resolveId(params)}`,
  'exam-results.destroy': (params) => `/exam-results/${resolveId(params)}`,
  'exam-results.trashed': '/exam-results/trashed',
  'exam-results.restore': (params) => `/exam-results/${resolveId(params)}/restore`,
  'exam-results.forceDelete': (params) => `/exam-results/${resolveId(params)}/force-delete`,

  // Homeworks routes
  'homeworks.index': '/homeworks',
  'homeworks.create': '/homeworks/create',
  'homeworks.store': '/homeworks',
  'homeworks.show': (params) => `/homeworks/${resolveId(params)}`,
  'homeworks.edit': (params) => `/homeworks/${resolveId(params)}/edit`,
  'homeworks.update': (params) => `/homeworks/${resolveId(params)}`,
  'homeworks.destroy': (params) => `/homeworks/${resolveId(params)}`,
  'homeworks.trashed': '/homeworks/trashed',
  'homeworks.restore': (params) => `/homeworks/${resolveId(params)}/restore`,
  'homeworks.forceDelete': (params) => `/homeworks/${resolveId(params)}/force-delete`,

  // HomeworkSubmissions routes
  'homework-submissions.index': '/homework-submissions',
  'homework-submissions.create': '/homework-submissions/create',
  'homework-submissions.store': '/homework-submissions',
  'homework-submissions.show': (params) => `/homework-submissions/${resolveId(params)}`,
  'homework-submissions.edit': (params) => `/homework-submissions/${resolveId(params)}/edit`,
  'homework-submissions.update': (params) => `/homework-submissions/${resolveId(params)}`,
  'homework-submissions.destroy': (params) => `/homework-submissions/${resolveId(params)}`,
  'homework-submissions.trashed': '/homework-submissions/trashed',
  'homework-submissions.restore': (params) => `/homework-submissions/${resolveId(params)}/restore`,
  'homework-submissions.forceDelete': (params) => `/homework-submissions/${resolveId(params)}/force-delete`,

  // LeaveRequests routes
  'leave-requests.index': '/leave-requests',
  'leave-requests.create': '/leave-requests/create',
  'leave-requests.store': '/leave-requests',
  'leave-requests.show': (params) => `/leave-requests/${resolveId(params)}`,
  'leave-requests.edit': (params) => `/leave-requests/${resolveId(params)}/edit`,
  'leave-requests.update': (params) => `/leave-requests/${resolveId(params)}`,
  'leave-requests.destroy': (params) => `/leave-requests/${resolveId(params)}`,
  'leave-requests.trashed': '/leave-requests/trashed',
  'leave-requests.restore': (params) => `/leave-requests/${resolveId(params)}/restore`,
  'leave-requests.forceDelete': (params) => `/leave-requests/${resolveId(params)}/force-delete`,

  // Messages routes
  'messages.index': '/messages',
  'messages.create': '/messages/create',
  'messages.store': '/messages',
  'messages.show': (params) => `/messages/${resolveId(params)}`,
  'messages.edit': (params) => `/messages/${resolveId(params)}/edit`,
  'messages.update': (params) => `/messages/${resolveId(params)}`,
  'messages.destroy': (params) => `/messages/${resolveId(params)}`,
  'messages.trashed': '/messages/trashed',
  'messages.restore': (params) => `/messages/${resolveId(params)}/restore`,
  'messages.forceDelete': (params) => `/messages/${resolveId(params)}/force-delete`,

  // Timetables routes
  'timetables.index': '/timetables',
  'timetables.create': '/timetables/create',
  'timetables.store': '/timetables',
  'timetables.show': (params) => `/timetables/${resolveId(params)}`,
  'timetables.edit': (params) => `/timetables/${resolveId(params)}/edit`,
  'timetables.update': (params) => `/timetables/${resolveId(params)}`,
  'timetables.destroy': (params) => `/timetables/${resolveId(params)}`,
  'timetables.trashed': '/timetables/trashed',
  'timetables.restore': (params) => `/timetables/${resolveId(params)}/restore`,
  'timetables.forceDelete': (params) => `/timetables/${resolveId(params)}/force-delete`,
};

export function route(name: string, params?: unknown): string {
  const routeValue = routes[name];

  if (!routeValue) {
    console.warn(`Route "${name}" not found`);
    return '/';
  }

  if (typeof routeValue === 'function') {
    const url = routeValue(params);

    if (isRouteParamRecord(params)) {
      const queryParams = { ...params };
      delete queryParams.id;

      return appendQuery(url, queryParams);
    }

    return url;
  }

  return appendQuery(routeValue, params);
}

// Make route available globally
(globalThis as { route?: (name: string, params?: unknown) => string }).route = route;

