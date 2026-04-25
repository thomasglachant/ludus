export function getDevDemoSaveId(pathname: string) {
  return pathname.match(/^\/dev\/demo\/([^/]+)\/?$/)?.[1] ?? null;
}
