import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { API_BASE_URL } from "./config";

function PopupApp() {
  // 取得右鍵選單傳來的字（會在 url ?text=xxx）
  const params = new URLSearchParams(window.location.search);
  const text = params.get("text") || "";

  const [loading, setLoading] = useState(false);
  const [translated, setTranslated] = useState<string>("");
  const [alternatives, setAlternatives] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!text) return;
    setLoading(true);
    fetch(
      `${API_BASE_URL}/api/translate?text=${encodeURIComponent(text)}&target=zh&alternatives=5`
    )
      .then((res) => res.json())
      .then((data) => {
        setTranslated(data.translated || "");
        setAlternatives(data.alternatives || []);
        setError(null);
      })
      .catch(() => {
        setError("❌ 翻譯失敗");
      })
      .finally(() => setLoading(false));
  }, [text]);

  return (
    <div style={{ padding: 16, fontSize: 16, minWidth: 280 }}>
      <div style={{ fontWeight: 700, marginBottom: 8 }}>
        {text ? `選字：${text}` : "請先選取文字"}
      </div>
      {loading && <div>載入中...</div>}
      {error && <div style={{ color: "red" }}>{error}</div>}
      {translated && (
        <>
          <div style={{ marginBottom: 4 }}>翻譯：{translated}</div>
          {alternatives.length > 0 && (
            <ul style={{ paddingLeft: 16, color: "#888", marginTop: 8 }}>
              {alternatives.map((alt, i) => (
                <li key={i}>{alt}</li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

const root = createRoot(document.getElementById("root")!);
root.render(<PopupApp />);
