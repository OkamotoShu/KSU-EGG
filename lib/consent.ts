// 同意画面の通過状態をブラウザーに保存
const CONSENT_KEY = "ksu-egg:consent:v1";

export function hasAcceptedConsent(): boolean {
  return localStorage.getItem(CONSENT_KEY) === "accepted";
}

export function acceptConsent(): void {
  localStorage.setItem(CONSENT_KEY, "accepted");
}