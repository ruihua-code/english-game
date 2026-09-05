import path from "node:path";
import { spawn } from "node:child_process";
import { app, BrowserWindow, dialog, ipcMain, Menu } from "electron";

let activeSpeechProcess;

function runNativeSpeech(text, rate) {
  if (activeSpeechProcess && !activeSpeechProcess.killed) activeSpeechProcess.kill();

  const safeRate = Math.max(0.5, Math.min(1.3, Number(rate) || 0.85));
  let command;
  let args;

  if (process.platform === "win32") {
    const encodedText = Buffer.from(text, "utf16le").toString("base64");
    const speechRate = Math.round((safeRate - 1) * 10);
    const script = `$text = [Text.Encoding]::Unicode.GetString([Convert]::FromBase64String('${encodedText}')); Add-Type -AssemblyName System.Speech; $speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer; $english = $speaker.GetInstalledVoices() | Where-Object { $_.VoiceInfo.Culture.Name -like 'en-*' } | Select-Object -First 1; if ($english) { $speaker.SelectVoice($english.VoiceInfo.Name) }; $speaker.Rate = ${speechRate}; $speaker.Speak($text); $speaker.Dispose()`;
    command = "powershell.exe";
    args = ["-NoProfile", "-NonInteractive", "-ExecutionPolicy", "Bypass", "-Command", script];
  } else if (process.platform === "darwin") {
    command = "say";
    args = ["-r", String(Math.round(safeRate * 190)), text];
  } else {
    return Promise.resolve({ ok: false, message: "当前系统暂未配置原生语音。" });
  }

  return new Promise((resolve) => {
    activeSpeechProcess = spawn(command, args, { windowsHide: true });
    activeSpeechProcess.once("spawn", () => resolve({ ok: true }));
    activeSpeechProcess.once("error", () => resolve({ ok: false, message: "系统语音服务启动失败。" }));
  });
}

ipcMain.handle("speech:speak", (_event, payload) => {
  const text = typeof payload?.text === "string" ? payload.text.slice(0, 500) : "";
  if (!text) return { ok: false, message: "没有可朗读的文本。" };
  return runNativeSpeech(text, payload?.rate);
});

function createWindow() {
  let isClosing = false;
  const win = new BrowserWindow({
    width: 1060,
    height: 760,
    minWidth: 920,
    minHeight: 680,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(import.meta.dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (!app.isPackaged) {
    win.loadURL("http://localhost:5173");
  } else {
    win.loadFile(path.join(app.getAppPath(), "dist", "index.html"));
  }

  win.once("ready-to-show", () => {
    win.show();
  });

  win.on("close", (event) => {
    if (isClosing) return;
    event.preventDefault();
    const choice = dialog.showMessageBoxSync(win, {
      type: "question",
      buttons: ["取消", "确认退出"],
      defaultId: 0,
      cancelId: 0,
      title: "确认退出",
      message: "确定要退出英语语法闯关吗？",
      detail: "当前学习记录会保留，但未完成的本题不会自动提交。",
    });
    if (choice === 1) {
      isClosing = true;
      win.destroy();
    }
  });
}

app.whenReady().then(() => {
  if (process.platform !== "darwin") Menu.setApplicationMenu(null);
  createWindow();
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (activeSpeechProcess && !activeSpeechProcess.killed) activeSpeechProcess.kill();
  if (process.platform !== "darwin") app.quit();
});
