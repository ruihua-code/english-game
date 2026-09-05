import React from "react";
import "./home.css";

export default function HomePage({ className, themes, theme, onThemeChange, levels, score, completedLevels, reviewLevels, reviewCount, recommendedIndex, mapMessage, onStartLevel, onStartReview, onReset }) {
  return <main className={className}>
    <header className="top"><p className="eyebrow">GRADE 7 ENGLISH</p><h1>英语语法闯关</h1><p>每关 20 题：基础练习、易错辨析和句子应用。</p><div className="theme-picker" aria-label="选择页面主题">{themes.map((item) => <button key={item.id} className={`theme-option${theme === item.id ? " active" : ""}`} type="button" onClick={() => onThemeChange(item.id)} aria-pressed={theme === item.id}><span className="theme-colors">{item.swatches.map((color) => <i key={color} style={{ backgroundColor: color }} />)}</span>{item.name}</button>)}</div></header>
    <section className="card level-map">
      <div className="map-heading"><div><h2>选择关卡主题</h2><p>{mapMessage}</p></div><span className="badge">总积分：{score}</span></div>
      {reviewCount > 0 && <button className="review-entry" type="button" onClick={onStartReview}><span>错题复习</span><strong>{reviewCount} 题待复习</strong><small>全部答对后会从错题本移除</small></button>}
      <div className="level-grid">{levels.map((item, index) => { const completed = completedLevels.includes(index); const review = reviewLevels.includes(index); const recommended = index === recommendedIndex; const status = completed ? "已完成，可重玩" : review ? "建议复习" : recommended ? "推荐从这里开始" : `建议先学习第 ${recommendedIndex + 1} 关`; return <button className={`level-choice${recommended ? " recommended" : ""}`} type="button" key={item.title} onClick={() => onStartLevel(index)}><span className="level-number">第 {index + 1} 关 · 20 题</span><strong>{item.title}</strong><span className="level-topic">{item.topic}</span><span className={`level-status${review ? " review" : completed ? " complete" : ""}`}>{status}</span></button>; })}</div>
      <footer className="map-footer"><span>提示：完成关卡后，间隔一天再进行错题复习，记忆会更牢固。</span><button className="ghost" type="button" onClick={onReset}>重置学习记录</button></footer>
    </section>
  </main>;
}
