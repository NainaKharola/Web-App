const STUDENT_SESSION_KEY = "webPortalStudentSession";

export function getStudentSession() {
  const value = sessionStorage.getItem(STUDENT_SESSION_KEY);
  return value ? JSON.parse(value) : null;
}

export function setStudentSession(credentials) {
  sessionStorage.setItem(STUDENT_SESSION_KEY, JSON.stringify(credentials));
}

export function clearStudentSession() {
  sessionStorage.removeItem(STUDENT_SESSION_KEY);
}
