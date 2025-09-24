import React, { useEffect, useMemo, useState } from "react";

type Question = {
  id: number;
  text: string;
  reverse?: boolean;
};

const QUESTIONS: Question[] = [
  { id: 1, text: "ボイスチャットで味方のミスを強い語調で指摘してしまう", reverse: false },
  { id: 2, text: "連敗すると味方のランクや装備に不満をぶつけてしまう", reverse: false },
  { id: 3, text: "ランク戦で苛立つと暴言をチャットに書き込んでしまう", reverse: false },
  { id: 4, text: "敵を倒した後に煽りエモートや死体撃ちで優越感を示してしまう", reverse: false },
  { id: 5, text: "思い通りに動かない味方へ指示を連打してしまう", reverse: false },
  { id: 6, text: "基本的にソロプレイが多く、仲間との連携を避けがちだ", reverse: false },
  { id: 7, text: "自分の立ち回りの失敗を素直に認めて謝ることができる", reverse: true },
  { id: 8, text: "初心者に設定や立ち回りを丁寧に伝えている", reverse: true },
  { id: 9, text: "ランクが下がってもゲームを楽しむ姿勢を保てている", reverse: true },
  { id: 10, text: "ソロで出会った味方を戦績だけで判断しがちだ", reverse: false },
  { id: 11, text: "気に入らなかったら即座に反論して言い争いになってしまう", reverse: false },
  { id: 12, text: "試合後にリプレイやメモで冷静に振り返っている", reverse: true },
];

const CHOICES = [
  { v: 2, label: "当てはまる", vibe: "🔥" },
  { v: 1, label: "当てはまらない", vibe: "💤" },
] as const;

const STORAGE_KEY = "toxicity-self-check-v1";
const TOTAL_SCORE = QUESTIONS.length * 2;

const TIPS = {
  low: [
    "味方のナイスプレーにはなるべく具体的に称賛を返し、好循環を維持しよう",
    "疲労を感じたら水分補給と姿勢調整で集中力をキープ",
    "良いプレーを見つけたらチャットやスタンプでポジティブに共有する",
  ],
  mid: [
    "イライラを感じたら 10 秒の深呼吸をしてから再度状況を整理する",
    "暴言になりそうなときは『次ラウンドでできる修正』を一つメモ",
    "試合ごとに味方の良かった点を 3 つ探すルーティンをつくる",
  ],
  high: [
    "連敗が続くときはログアウトして別のアクティビティで気分転換",
    "信頼できるフレンドにプレイを観てもらい冷静なフィードバックを得る",
    "必要に応じてメンタルコーチやコミュニティ規約を活用しセルフチェック",
  ],
} as const;

const QUIZ_QUESTIONS = [
  {
    id: 1,
    question: "チームでトキシック発言が増える主な原因は？",
    options: ["競争以外の娯楽にあまり興味がない", "勝率が高いから", "ボイスチャットが苦手だから"],
    answer: 0,
  },
  {
    id: 2,
    question: "イライラが始まったときに最初にすべき行動は？",
    options: ["味方を説教する", "一度離席してクールダウンする", "全体チャットで相手を挑発する"],
    answer: 1,
  },
  {
    id: 3,
    question: "建設的な話し合いの基本は？",
    options: ["事実→感情→提案の順で伝える", "とにかく声を荒げる", "無視してプレイを続ける"],
    answer: 0,
  },
  {
    id: 4,
    question: "味方のミスに気付いたとき、まず取るべき対応は？",
    options: ["自分がなぜソロプレイをしているか？をよく考える", "即座にチャットで指摘する", "リスキーなプレイで仕返しする"],
    answer: 0,
  },
  {
    id: 5,
    question: "悪意あるチャットに遭遇したときのベストな解決策は？",
    options: ["雑音をミュートして自分の余計な反応を防ぐ", "さらに言い返す", "試合を放棄する"],
    answer: 0,
  },
  {
    id: 6,
    question: "連敗中に試したい自分自身のケアは？",
    options: ["短い休憩とポジティブな振り返り", "怒りのまま連戦する", "SNSで愚痴を拡散する"],
    answer: 0,
  },
  {
    id: 7,
    question: "チームメイトに信頼してもらうために大切なのは？",
    options: ["安定したコミュニケーションと傾聴", "自分の成績を自慢する", "指示を一方的に出す"],
    answer: 0,
  },
  {
    id: 8,
    question: "メンタルが不安定なときに避けたいプレイは？",
    options: ["ランク戦での長時間ソロプレイ", "友人とのカジュアルマッチ", "リプレイで冷静に復習"],
    answer: 0,
  },
  {
    id: 9,
    question: "トキシックな文化が広がると最も失われるものは？",
    options: ["自分自身の学びと協力の機会", "反応速度", "グラフィック品質"],
    answer: 0,
  },
  {
    id: 10,
    question: "自分の言動がトキシックになりかけたと感じたら？",
    options: ["率直に謝って行動を改める", "そのまま押し通す", "PCのせいにする"],
    answer: 0,
  },
] as const;

const ZONE_CLASS = {
  low: "zone-chip low",
  mid: "zone-chip mid",
  high: "zone-chip high",
} as const;

type Answers = Record<number, number>;

type BandInfo = {
  band: string;
  colorClass: (typeof ZONE_CLASS)[keyof typeof ZONE_CLASS];
  tipKey: keyof typeof TIPS;
  message: string;
  personaTitle: string;
  personaImage: string;
  personaAlt: string;
};

function scoreToBand(score: number): BandInfo {
  if (score <= 14) {
    return {
      band: "ピュア天使プレイヤー",
      colorClass: ZONE_CLASS.low,
      tipKey: "low",
      message: "仲間の士気まで上げる空気清浄機的存在。きっとあなたは誰からもゲームに誘われるような人でしょう。",
      personaTitle: "称号：聖人",
      personaImage: "/images/persona-angel.svg",
      personaAlt: "PCとスマホを扱う天使のイラスト",
    };
  }
  if (score <= 18) {
    return {
      band: "トキシック予備軍プレイヤー",
      colorClass: ZONE_CLASS.mid,
      tipKey: "mid",
      message: "トキシックになっている自分の姿を俯瞰して見られるなら、まだ間に合う！",
      personaTitle: "称号：キレやすい人間",
      personaImage: "/images/persona-mid.svg",
      personaAlt: "怒って机を叩く人のイラスト",
    };
  }
  return {
    band: "前世トキシックプレイヤー",
    colorClass: ZONE_CLASS.high,
    tipKey: "high",
    message: "もう船下りよう！自分を癒してあげて！誰も幸せにならないよ！",
    personaTitle: "称号：大気汚染物質 PM1.5",
    personaImage: "/images/persona-toxic.svg",
    personaAlt: "紫色のスモッグに包まれた人物のイラスト",
  };
}

function nextIndex(map: Answers): number {
  const idx = QUESTIONS.findIndex(question => !map[question.id]);
  return idx === -1 ? QUESTIONS.length : idx;
}

export default function App() {
  const [answers, setAnswers] = useState<Answers>({});
  const [activeIndex, setActiveIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<Record<number, number>>({});

  const score = useMemo(() => {
    return QUESTIONS.reduce((sum, question) => {
      const value = answers[question.id];
      if (!value) return sum;
      const normalized = question.reverse ? 3 - value : value;
      return sum + normalized;
    }, 0);
  }, [answers]);

  const bandInfo = scoreToBand(score);
  const answeredCount = Object.keys(answers).length;
  const unansweredCount = QUESTIONS.length - answeredCount;
  const activeQuestion = activeIndex < QUESTIONS.length ? QUESTIONS[activeIndex] : null;
  const isComplete = answeredCount === QUESTIONS.length;
  const isTipsUnlocked = isComplete;
  const isQuizUnlocked = isComplete;

  const quizAnsweredCount = Object.keys(quizAnswers).length;
  const quizScore = useMemo(() => {
    return QUIZ_QUESTIONS.reduce((sum, quiz) => {
      const picked = quizAnswers[quiz.id];
      if (picked === undefined) return sum;
      return sum + (picked === quiz.answer ? 1 : 0);
    }, 0);
  }, [quizAnswers]);
  const quizComplete = quizAnsweredCount === QUIZ_QUESTIONS.length;

  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved) as Answers;
        setAnswers(parsed);
        setActiveIndex(nextIndex(parsed));
      }
    } catch (error) {
      console.warn("Failed to load saved answers", error);
    }
  }, []);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(answers));
    } catch (error) {
      console.warn("Failed to persist answers", error);
    }
  }, [answers]);

  function handleSelect(questionId: number, value: number) {
    setAnswers(prev => {
      const next = { ...prev, [questionId]: value };
      setActiveIndex(nextIndex(next));
      return next;
    });
  }

  function handleJump(index: number) {
    const isAnswered = Boolean(answers[QUESTIONS[index].id]);
    if (isAnswered || index === activeIndex) {
      setActiveIndex(index);
    }
  }

  function handleQuizSelect(questionId: number, optionIndex: number) {
    if (!isQuizUnlocked) return;
    setQuizAnswers(prev => ({ ...prev, [questionId]: optionIndex }));
  }

  function resetQuiz() {
    setQuizAnswers({});
  }

  function resetAll() {
    setAnswers({});
    setActiveIndex(0);
    setQuizAnswers({});
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.warn("Failed to clear storage", error);
    }
  }

  return (
    <div className="app-shell">
      <div className="selfcheck-card">
        <header className="card-header">
          <h1 className="headline">
            FPSトキシック診断 <em>beta</em>
          </h1>
          <p className="tagline">
            試合後に「言い過ぎたかも？」と感じたら、本当に楽しいと思えることを探そう！
          </p>
          <div className="badges">
            <span className="badge">🔥 12問でさくっとセルフチェック</span>
            <span className="badge">💾 データはブラウザにだけ保存</span>
            <span className="badge">⏱️ 回答済み <strong>{answeredCount}</strong> / {QUESTIONS.length}</span>
          </div>
          <div className="progress-track">
            {QUESTIONS.map((question, index) => {
              const answered = Boolean(answers[question.id]);
              const isCurrent = index === activeIndex && activeIndex < QUESTIONS.length;
              const className = [
                "progress-node",
                answered ? "done" : "",
                isCurrent ? "current" : "",
              ]
                .filter(Boolean)
                .join(" ");
              const disabled = !answered && !isCurrent;
              return (
                <button
                  key={question.id}
                  type="button"
                  className={className}
                  onClick={() => handleJump(index)}
                  disabled={disabled}
                >
                  Q{question.id}
                </button>
              );
            })}
          </div>
        </header>

        <section className="question-stage">
          {activeQuestion ? (
            <article key={activeQuestion.id} className="stage-card">
              <div className="stage-title">
                <span>Q{activeQuestion.id}</span>
                {activeQuestion.text}
              </div>
              <div className="choice-grid">
                {CHOICES.map(choice => {
                  const isSelected = answers[activeQuestion.id] === choice.v;
                  return (
                    <button
                      key={choice.v}
                      type="button"
                      className={`choice-button${isSelected ? " is-selected" : ""}`}
                      onClick={() => handleSelect(activeQuestion.id, choice.v)}
                      aria-pressed={isSelected}
                    >
                      <div className="value">{choice.vibe}</div>
                      <div className="label">{choice.label}</div>
                    </button>
                  );
                })}
              </div>
            </article>
          ) : (
            <div className="stage-empty">
              <h2>全問クリア！</h2>
              <div className="persona-highlight">
                <img className="persona-illustration" src={bandInfo.personaImage} alt={bandInfo.personaAlt} />
                <p className="persona-title">{bandInfo.personaTitle}</p>
              </div>
              <p className="stage-score">総スコア: <strong>{score} / {TOTAL_SCORE}</strong></p>
              <p>レコメンドされたアクションプランをチェックして、次のマッチへ備えましょう。</p>
            </div>
          )}
        </section>

        <section className="status-panel">
          <div className="status-top">
            <div className={bandInfo.colorClass}>現在のゾーン: {bandInfo.band}</div>
            {isComplete ? (
              <div className="status-metric">
                <span>総スコア</span>
                <strong>
                  {score} / {TOTAL_SCORE}
                </strong>
              </div>
            ) : (
              <div className="status-metric">
                <span>進行度</span>
                <strong>
                  {answeredCount} / {QUESTIONS.length}
                </strong>
              </div>
            )}
          </div>
          <p className="tagline" style={{ marginTop: 0 }}>
            {bandInfo.message.split('\n').map((line, idx) => (
              <React.Fragment key={idx}>
                {idx > 0 && <br />}
                {line}
              </React.Fragment>
            ))}
          </p>

          <div className={`tip-card${isTipsUnlocked ? "" : " is-locked"}`}>
            <div className="tip-card-heading">
              <h2>NEXTアクション</h2>
              {!isTipsUnlocked && (
                <span className="tip-lock" aria-hidden="true" title="全問回答で解放">
                  🔒 LOCKED
                </span>
              )}
            </div>
            {!isTipsUnlocked && (
              <p className="lock-hint">解放条件: 12問すべてに回答すると閲覧できるよ</p>
            )}
            <ul aria-hidden={!isTipsUnlocked}>
              {TIPS[bandInfo.tipKey].map((tip, index) => (
                <li key={index}>{tip}</li>
              ))}
            </ul>
          </div>

          <p className="helper-text">
            ※ この診断はセルフリフレクション用の簡易的な目安です。必要に応じて信頼できる人や専門家に相談しながら無理なく改善を進めてください。
          </p>

          <div className="action-row">
            <button type="button" className="reset-button" onClick={resetAll}>
              解答をリセット
            </button>
            {unansweredCount > 0 && (
              <span className="unanswered-pill">未回答: {unansweredCount} 問</span>
            )}
          </div>

          <section className={`quiz-panel${isQuizUnlocked ? "" : " is-locked"}`}>
            <header className="quiz-header">
              <div className="quiz-header-top">
                <h3>なぜトキシックをしてしまうのだろうか？</h3>
                {!isQuizUnlocked && (
                  <span className="quiz-lock" aria-hidden="true" title="全問回答で解放">
                    🔒 LOCKED
                  </span>
                )}
              </div>
              {!isQuizUnlocked && (
                <p className="lock-hint">解放条件: 12問すべてに回答すると挑戦できるよ</p>
              )}
              <p className="quiz-intro">状況判断や感情コントロールを振り返る10問のクイズ。復習して、次はもっと上手に立ち回ろう。</p>
              <div className="quiz-progress">
                <span>回答数: {quizAnsweredCount} / {QUIZ_QUESTIONS.length}</span>
                {quizComplete && (
                  <span className="quiz-score">正解数: {quizScore} / {QUIZ_QUESTIONS.length}</span>
                )}
              </div>
            </header>
            <div className="quiz-questions" aria-hidden={!isQuizUnlocked}>
              {QUIZ_QUESTIONS.map(quiz => {
                const selected = quizAnswers[quiz.id];
                return (
                  <article key={quiz.id} className="quiz-card">
                    <h4>Q{quiz.id}. {quiz.question}</h4>
                    <div className="quiz-options">
                      {quiz.options.map((option, idx) => {
                        const isSelected = selected === idx;
                        const isCorrect = quizComplete && idx === quiz.answer;
                        const isIncorrect = quizComplete && isSelected && idx !== quiz.answer;
                        const classNames = [
                          "quiz-option",
                          isSelected ? "selected" : "",
                          isCorrect ? "correct" : "",
                          isIncorrect ? "incorrect" : "",
                        ].filter(Boolean).join(" ");
                        return (
                          <button
                            type="button"
                            key={idx}
                            className={classNames}
                            onClick={() => handleQuizSelect(quiz.id, idx)}
                            disabled={!isQuizUnlocked}
                            aria-disabled={!isQuizUnlocked}
                          >
                            {option}
                          </button>
                        );
                      })}
                    </div>
                  </article>
                );
              })}
            </div>
            <div className="quiz-actions">
              <button
                type="button"
                className="quiz-reset"
                onClick={resetQuiz}
                disabled={!isQuizUnlocked}
                aria-disabled={!isQuizUnlocked}
              >
                クイズをリセット
              </button>
              {quizComplete && (
                <p className="quiz-result-message">正解だったポイントを意識して、次の試合で実践しよう！</p>
              )}
            </div>
          </section>
        </section>
      </div>
    </div>
  );
}
