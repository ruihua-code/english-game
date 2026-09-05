import React from "react";
import "./quiz.css";

export default function QuizPage({ className, levelLabel, levelData, question, qIndex, score, lives, passTarget, selected, isLocked, feedback, feedbackType, tip, isSpeechLoading, onRead, onCheckAnswer, onNextQuestion, onBack }) {
  const sentence = selected === null ? question.q : question.q.replace(/___/g, question.options[selected]);
  const choiceClass = (index) => !isLocked ? "choice" : index === question.answer ? "choice correct" : index === selected ? "choice wrong" : "choice";
  const progress = ((qIndex + 1) / levelData.questions.length) * 100;
  const heartCount = "❤".repeat(lives);

  return <main className={className}>
    <header className="top"><p className="eyebrow">{levelLabel === "错题复习" ? "REVIEW MODE · GRADE 7 ENGLISH" : "GRADE 7 ENGLISH"}</p><h1>英语语法闯关</h1><p>{levelData.title}</p></header>
    <section className="card quiz-card">
      <div className="status"><span className="badge">{levelLabel}</span><span className="hearts" aria-label={`剩余 ${lives} 颗心`}>{heartCount}</span><span className="badge">积分：{score}</span></div>
      <div className="progress-wrap"><div className="progress-row"><span>进度：{qIndex + 1}/{levelData.questions.length}</span><span>通关目标：{passTarget} 题</span></div><div className="progress"><span style={{ width: `${progress}%` }} /></div></div>
      <article className="question-card">
        <h2>关卡主题：{levelData.title}</h2><p className="topic-note">本关知识：{levelData.topic}</p>
        <p className="prompt">第 {qIndex + 1} 题：{sentence}<button className={`inline-voice${isSpeechLoading ? " loading" : ""}`} type="button" disabled={!isLocked || isSpeechLoading} onClick={onRead} aria-label={isSpeechLoading ? "语音加载中" : "朗读完整句子"} title={isSpeechLoading ? "语音加载中" : "朗读完整句子"}>{isSpeechLoading ? "◌" : "🔊"}</button></p>
        <div className="answer-area">
          <p className="question-instruction">请选择最合适的选项，补全或判断句子是否符合语法规则。</p>
          <div className="choices">{question.options.map((option, index) => <button key={option} className={choiceClass(index)} type="button" disabled={isLocked} onClick={() => onCheckAnswer(index)}>{option}</button>)}</div>
          <p className="tip">{tip}</p>
        </div>
      </article>
      <div className="feedback-slot" aria-live="polite">{feedback && <div className={`result ${feedbackType}`}>{feedback}</div>}</div>
      <footer className="quiz-actions"><button className="ghost" type="button" onClick={onBack}>返回关卡地图</button><button className="primary" type="button" disabled={!isLocked} onClick={onNextQuestion}>{qIndex === levelData.questions.length - 1 ? "结算本关" : "下一题"}</button></footer>
    </section>
  </main>;
}
