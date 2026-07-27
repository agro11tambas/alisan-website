const NAVIGATION_HISTORY_KEY = "alisan:internal-navigation-history";
const MAX_HISTORY_LENGTH = 30;

function readHistory(): string[] {
  if (typeof window === "undefined") return [];

  try {
    const value = window.sessionStorage.getItem(NAVIGATION_HISTORY_KEY);
    const history = value ? JSON.parse(value) : [];
    return Array.isArray(history)
      ? history.filter((path): path is string => typeof path === "string")
      : [];
  } catch {
    return [];
  }
}

function writeHistory(history: string[]) {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(
    NAVIGATION_HISTORY_KEY,
    JSON.stringify(history.slice(-MAX_HISTORY_LENGTH))
  );
}

export function recordInternalNavigation(pathname: string) {
  const history = readHistory();
  const currentPath = history.at(-1);

  if (currentPath === pathname) return;

  if (history.at(-2) === pathname) {
    history.pop();
  } else {
    history.push(pathname);
  }

  writeHistory(history);
}

export function getInternalBackDestination(currentPathname: string) {
  const history = readHistory();

  while (history.at(-1) === currentPathname) {
    history.pop();
  }

  const destination = history.at(-1) || "/";
  writeHistory(history.length > 0 ? history : [destination]);

  return destination;
}
