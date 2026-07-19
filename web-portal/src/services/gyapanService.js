import { clearAdminToken, getAdminToken } from "./adminService";

const API_URL = `${import.meta.env.VITE_API_URL}/admin/gyapan`;
const headers = () => ({ Authorization: `Bearer ${getAdminToken()}`, "Content-Type": "application/json" });
async function parse(response) { const body = await response.json().catch(() => ({})); if (response.status === 401) clearAdminToken(); if (!response.ok) throw new Error(body.message || "Gyapan request failed."); return body; }
export async function fetchGyapanStudents(date = "") { const params = date ? `?date=${encodeURIComponent(date)}` : ""; return parse(await fetch(`${API_URL}/students${params}`, { headers: headers() })); }
export async function createGyapanPreview(payload) { return parse(await fetch(`${API_URL}/preview`, { method: "POST", headers: headers(), body: JSON.stringify(payload) })); }
export async function getGyapan(id) { return parse(await fetch(`${API_URL}/${id}`, { headers: headers() })); }
export async function updateGyapan(id, payload) { return parse(await fetch(`${API_URL}/${id}/edit`, { method: "PUT", headers: headers(), body: JSON.stringify(payload) })); }
export async function generateGyapanPdf(id) { return parse(await fetch(`${API_URL}/${id}/generate`, { method: "POST", headers: headers() })); }
