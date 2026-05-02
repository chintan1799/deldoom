const HF_TOKEN = import.meta.env.VITE_HF_TOKEN as string | undefined;
const HF_BASE = 'https://datasets-server.huggingface.co';

interface HFRow<T> {
  row_idx: number;
  row: T;
  truncated_cells: string[];
}

interface HFResponse<T> {
  rows: HFRow<T>[];
  num_rows_total: number;
}

export async function fetchHFRows<T>(
  dataset: string,
  split: string,
  offset: number,
  length: number
): Promise<{ rows: T[]; total: number }> {
  const url = `${HF_BASE}/rows?dataset=${encodeURIComponent(dataset)}&config=default&split=${split}&offset=${offset}&length=${length}`;
  const headers: Record<string, string> = { Accept: 'application/json' };
  if (HF_TOKEN) headers['Authorization'] = `Bearer ${HF_TOKEN}`;

  const res = await fetch(url, { headers });
  if (!res.ok) throw new Error(`HF API ${res.status}`);

  const json: HFResponse<T> = await res.json();
  return {
    rows: json.rows.map((r) => r.row),
    total: json.num_rows_total,
  };
}

export function randomOffset(total: number, length: number): number {
  return Math.floor(Math.random() * Math.max(1, total - length));
}
