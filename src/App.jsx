import React, { useMemo, useState } from "react";
import { levels } from "./data/levels";
import HomePage from "./pages/home/HomePage";
import QuizPage from "./pages/quiz/QuizPage";

const themes = [
  { id: "sapphire", name: "皇家蓝宝石", swatches: ["#071a33", "#49a6ff", "#102a4d"] },
  { id: "forest", name: "翡翠书房", swatches: ["#062d2a", "#72d8a3", "#0c4641"] },
  { id: "burgundy", name: "勃艮第红", swatches: ["#2b141c", "#e7ab65", "#48212c"] },
  { id: "obsidian", name: "曜石鎏金", swatches: ["#101216", "#d7a94a", "#1b2028"] },
];

async function speakText(text, rate) {
  if (!window.electronHost?.speak) return { ok: false, message: "请在桌面应用中使用朗读功能。" };
  return window.electronHost.speak(text, rate);
}

export default function App() {
  const [view, setView] = useState("home");
  const [theme, setTheme] = useState("sapphire");
  const [level, setLevel] = useState(0);
  const [qIndex, setQIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [localRight, setLocalRight] = useState(0);
  const [completedLevels, setCompletedLevels] = useState([]);
  const [reviewLevels, setReviewLevels] = useState([]);
  const [mistakes, setMistakes] = useState([]);
  const [reviewSession, setReviewSession] = useState(null);
  const [isLocked, setIsLocked] = useState(false);
  const [selected, setSelected] = useState(null);
  const [feedback, setFeedback] = useState("");
  const [feedbackType, setFeedbackType] = useState("ok");
  const [tip, setTip] = useState("先读题目，再点你认为正确的答案。");
  const [speechRate, setSpeechRate] = useState(0.85);
  const [isSpeechLoading, setIsSpeechLoading] = useState(false);
  const [mapMessage, setMapMessage] = useState("从推荐关卡开始，或选择你想复习的知识点。");
  const isReviewMode = reviewSession !== null;
  const levelData = useMemo(() => reviewSession || levels[level], [level, reviewSession]);
  const question = levelData.questions[qIndex];
  const passTarget = isReviewMode ? levelData.questions.length : Math.ceil(levelData.questions.length * 0.75);
  const firstIncomplete = levels.findIndex((_, index) => !completedLevels.includes(index));
  const recommendedIndex = firstIncomplete === -1 ? 0 : firstIncomplete;

  const startLevel = (index) => { setReviewSession(null); setLevel(index); setQIndex(0); setLives(3); setLocalRight(0); setIsLocked(false); setSelected(null); setFeedback(""); setTip("先读题目，再点你认为正确的答案。"); setView("quiz"); };
  const startReview = () => {
    if (!mistakes.length) return;
    const questions = mistakes.map(({ levelIndex, questionIndex }) => ({ ...levels[levelIndex].questions[questionIndex], sourceLevel: levelIndex, sourceQuestion: questionIndex }));
    setReviewSession({ title: "错题复习", topic: "逐题复习曾经答错的语法点", questions });
    setQIndex(0); setLives(3); setLocalRight(0); setIsLocked(false); setSelected(null); setFeedback(""); setTip("每题答对后会从错题本中移除。"); setView("quiz");
  };
  const returnToMap = () => { setMapMessage("请选择一个主题继续学习，已完成关卡可随时重玩。"); setView("home"); };
  const resetAll = () => { setScore(0); setCompletedLevels([]); setReviewLevels([]); setMistakes([]); setReviewSession(null); setMapMessage("学习记录已重置，请选择一个关卡开始挑战。"); setView("home"); };
  const retryWithTip = () => { setLives(3); setLocalRight(0); setQIndex(0); setIsLocked(false); setSelected(null); setFeedback("错误已达到上限，已进入补充提示模式，请再试一遍。"); setFeedbackType("ok"); setTip("建议先确认句子中的主语人称，再选择 be 动词或动词变化。"); };
  const checkAnswer = (index) => {
    if (isLocked) return;
    setIsLocked(true); setSelected(index);
    if (index === question.answer) {
      if (isReviewMode) setMistakes((items) => items.filter((item) => item.levelIndex !== question.sourceLevel || item.questionIndex !== question.sourceQuestion));
      setScore((value) => value + 10); setLocalRight((value) => value + 1); setFeedback("答对了！做得很好。"); setFeedbackType("ok"); setTip(""); return;
    }
    setReviewLevels((items) => items.includes(level) ? items : [...items, level]);
    if (!isReviewMode) setMistakes((items) => items.some((item) => item.levelIndex === level && item.questionIndex === qIndex) ? items : [...items, { levelIndex: level, questionIndex: qIndex }]);
    const nextLives = Math.max(0, lives - 1);
    setLives(nextLives); setFeedback("再看一遍题干，记住规则后再试。"); setFeedbackType("bad"); setTip(question.explain || "可回到这类题的规则说明重新整理。");
    if (nextLives === 0) retryWithTip();
  };
  const nextQuestion = () => {
    if (qIndex < levelData.questions.length - 1) { setQIndex((value) => value + 1); setIsLocked(false); setSelected(null); setFeedback(""); setTip("先读题目，再点你认为正确的答案。"); return; }
    if (isReviewMode) {
      if (localRight >= passTarget) { setMapMessage("本次错题复习完成，继续保持！"); setReviewSession(null); setView("home"); return; }
      setFeedback(`错题复习需全部答对（${localRight}/${levelData.questions.length}），请再练一次。`); retryWithTip(); return;
    }
    if (localRight >= passTarget) { setCompletedLevels((items) => items.includes(level) ? items : [...items, level]); setReviewLevels((items) => items.filter((item) => item !== level)); setMapMessage(level === levels.length - 1 ? "全部主题已挑战完成。可选择任意关卡巩固练习。" : `第 ${level + 1} 关已通过！下一步建议挑战第 ${level + 2} 关。`); setView("home"); return; }
    setFeedback(`本关未达标（${localRight}/${levelData.questions.length}），请再挑战一次。`); retryWithTip();
  };
  const readQuestion = async () => {
    setIsSpeechLoading(true);
    const result = await speakText(question.q.replace(/___/g, question.options[selected]), speechRate);
    setIsSpeechLoading(false);
    if (!result.ok) {
      setFeedback(result.message || "系统语音服务启动失败，请检查英文语音是否已安装。");
      setFeedbackType("bad");
    }
  };
  const className = `app-shell theme-${theme}`;
  if (view === "home") return <HomePage className={className} themes={themes} theme={theme} onThemeChange={setTheme} levels={levels} score={score} completedLevels={completedLevels} reviewLevels={reviewLevels} reviewCount={mistakes.length} recommendedIndex={recommendedIndex} mapMessage={mapMessage} onStartLevel={startLevel} onStartReview={startReview} onReset={resetAll} />;
  return <QuizPage className={className} levelLabel={isReviewMode ? "错题复习" : `第 ${level + 1} 关`} levelData={levelData} question={question} qIndex={qIndex} score={score} lives={lives} passTarget={passTarget} selected={selected} isLocked={isLocked} feedback={feedback} feedbackType={feedbackType} tip={tip} isSpeechLoading={isSpeechLoading} onRead={readQuestion} onCheckAnswer={checkAnswer} onNextQuestion={nextQuestion} onBack={returnToMap} />;
}
