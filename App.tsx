import React, { useMemo, useState } from "react";

// Minimal, client‑side only self‑check. No tracking.
// Usage: Drop this component into a React app and render <App />.
// Styling uses Tailwind utility classes (optional but nice). Remove classes if not using Tailwind.

const QUESTIONS = [
  { id: 1,  text: "苛立ちやすく、すぐ攻撃的な言い回しになる", reverse: false },
  { id: 2,  text: "相手の失敗を執拗に指摘してしまう",           reverse: false },
  { id: 3,  text: "自分の非を認めるのが極端に苦手",               reverse: false },
  { id: 4,  text: "皮肉・見下し表現をよく使う",                   reverse: false },
  { id: 5,  text: "SNSやチャットで感情的に反応しがち",           reverse: false },
  { id: 6,  text: "相手の境界線（時間・頼み方など）を尊重できる", reverse: true  },
  { id: 7,  text: "相手の視点で考え直すことがある",               reverse: true  },
  { id: 8,  text: "失礼だった時は素直に謝れる",                   reverse: true  },
  { id: 9,  text: "会話で相手の話を最後まで聞ける",               reverse: true  },
  { id: 10, text: "冗談のつもりで相手を傷つけてしまう",           reverse: false },
  { id: 11, text: "ストレス時に周囲へ当たりがち",                 reverse: false },
  { id: 12, text: "建設的なフィードバックを心がけている",         reverse: true  },
];

const CHOICES = [
  { v: 1, label: "まったく違う" },
  { v: 2, label: "あまり違う" },
  { v: 3, label: "どちらともいえない" },
  { v: 4, label: "やや当てはまる" },
  { v: 5, label: "とても当てはまる" },
];

function scoreToBand(score: number) {
  // Max 60 (12 × 5)
  if (score <= 20) return { band: "低め", color: "bg-green-100 text-green-800", tipKey: "low" };
  if (score <= 35) return { band: "中程度", color: "bg-yellow-100 text-yellow-900", tipKey: "mid" };
  return { band: "高め", color: "bg-red-100 text-red-800", tipKey: "high" };
}

const TIPS: Record<string, string[]> = {
  low: [
    "良い習慣を維持。相手への確認（合意・境界線）を続ける",
    "感情が強い時は一拍置いてから返信する",
    "ポジティブなフィードバック比率を意識（例: 3:1）",
  ],
  mid: [
    "“事実/感情/要望”を分けて伝える練習",
    "トリガー（寝不足・締切前など）を記録し、対策をペアにする",
    "攻撃的文を“観察+提案”に書き換える（例:『遅い』→『◯時までに助かる？』）",
  ],
  high: [
    "返信前に10分ルール・下書き保存を徹底",
    "Iメッセージ（私は◯と感じた）を使い、ラベリングや決めつけを避ける",
    "必要なら第三者レビュー/メンタルヘルス相談も検討（セルフケア優先）",
  ],
};

export default function App() {
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const allAnswered = QUESTIONS.every(q => answers[q.id]);

  const score = useMemo(() => {
    // reverse=true は低いほどトキシック度が高い指標なので反転（1→5, 2→4, 3→3, 4→2, 5→1）
    return QUESTIONS.reduce((sum, q) => {
      const v = answers[q.id];
      if (!v) return sum;
      const normalized = q.reverse ? (6 - v) : v; 
      return sum + normalized;
    }, 0);
  }, [answers]);

  const bandInfo = scoreToBand(score);

  function resetAll() {
    setAnswers({});
    localStorage.removeItem("tox-selfcheck-v1");
  }

  // Persist locally
  React.useEffect(() => {
    const saved = localStorage.getItem("tox-selfcheck-v1");
    if (saved) setAnswers(JSON.parse(saved));
  }, []);
  React.useEffect(() => {
    localStorage.setItem("tox-selfcheck-v1", JSON.stringify(answers));
  }, [answers]);

  return (
    <div className="min-h-screen bg-slate-50 py-10 px-4">
      <div className="max-w-3xl mx-auto">
        <header className="mb-6">
          <h1 className="text-2xl font-bold">トキシック傾向セルフチェック（MVP）</h1>
          <p className="text-sm text-slate-600 mt-1">匿名・ブラウザ内保存。医療・診断ではありません。</p>
        </header>

        <section className="bg-white shadow rounded-2xl p-5">
          <ol className="space-y-5">
            {QUESTIONS.map(q => (
              <li key={q.id} className="border-b last:border-b-0 pb-5">
                <p className="font-medium mb-3">{q.id}. {q.text}</p>
                <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                  {CHOICES.map(c => {
                    const selected = answers[q.id] === c.v;
                    return (
                      <button
                        key={c.v}
                        onClick={() => setAnswers(a => ({ ...a, [q.id]: c.v }))}
                        className={[
                          "text-left border rounded-xl px-3 py-2 text-sm",
                          selected ? "border-slate-900 ring-2 ring-slate-900" : "border-slate-200 hover:border-slate-400",
                        ].join(" ")}
                        aria-pressed={selected}
                      >
                        <div className="font-semibold">{c.v}</div>
                        <div className="opacity-80">{c.label}</div>
                      </button>
                    );
                  })}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section className="mt-6 flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-full ${bandInfo.color}`}>
              <span className="text-sm font-semibold">現在の傾向: {bandInfo.band}</span>
            </div>
            <span className="text-sm text-slate-600">合計スコア: {score} / 60</span>
          </div>

          <div className="bg-white shadow rounded-2xl p-5">
            <h2 className="font-bold mb-2">すぐに試せる対策</h2>
            <ul className="list-disc pl-6 space-y-1">
              {TIPS[bandInfo.tipKey].map((t, i) => (
                <li key={i}>{t}</li>
              ))}
            </ul>
          </div>

          <div className="text-xs text-slate-500">
            <p>※ このツールはセルフリフレクションの補助です。結果は状況や文脈で変わります。必要に応じて信頼できる人や専門家の支援も検討してください。</p>
          </div>

          <div className="flex gap-2 mt-2">
            <button onClick={resetAll} className="px-3 py-2 text-sm rounded-lg border border-slate-300 hover:bg-slate-100">リセット</button>
            {!allAnswered && (
              <span className="text-sm text-slate-600 self-center">未回答があります（{QUESTIONS.filter(q => !answers[q.id]).length} 問）</span>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
