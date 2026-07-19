const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
const backendUrl = apiUrl.replace(/\/api\/?$/, "").replace(/\/$/, "");

export function getUploadUrl(fileUrl) {
  if (!fileUrl || /^https?:\/\//i.test(fileUrl)) return fileUrl;

  return `${backendUrl}/${fileUrl.replace(/^\/+/, "")}`;
}
