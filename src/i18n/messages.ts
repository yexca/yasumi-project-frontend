import {
  DEFAULT_LOCALES_BY_LANGUAGE,
  LANGUAGE_CODES,
  type LanguageCode,
} from "@/domain/constants/shared";

type MessageValues = Record<string, string | number>;

export type Messages = Record<string, string>;

export const messages: Record<LanguageCode, Messages> = {
  en: {
    "nav.today": "Today",
    "nav.inbox": "Inbox",
    "nav.upcoming": "Upcoming",
    "nav.deadlines": "Deadlines",
    "nav.ideas": "Idea Pool",
    "nav.areas": "Areas",
    "nav.completed": "Completed",
    "nav.archive": "Archive",
    "nav.settings": "Settings",
    "shell.primaryNavigation": "Primary navigation",
    "quickAdd.button": "Quick Add",
    "sync.placeholderDisconnected": "Local sync not connected",
    "page.today.description": "A calm placeholder for the daily attention surface.",
    "page.inbox.description": "Captured items will wait here until they are classified.",
    "page.upcoming.description": "Future planned work will be grouped by date.",
    "page.deadlines.description": "Deadline-focused planning will appear here.",
    "page.ideas.description": "Ideas will stay visible without becoming failed tasks.",
    "page.areas.description": "Area management and area-scoped planning will live here.",
    "page.areaDetail.description": "Area scoped placeholder for {areaId}.",
    "page.completed.description": "Completed work and reopen actions will appear here.",
    "page.archive.description": "Recoverable history and archived work will appear here.",
    "page.settings.description": "Language, timezone, and display preferences will appear here.",
    "settings.appearance.title": "Appearance",
    "settings.appearance.description": "Local visual preferences stay on this device.",
    "settings.theme.label": "Theme",
    "settings.theme.description": "Follow the system theme or choose a fixed mode.",
    "settings.theme.system": "System",
    "settings.theme.light": "Light",
    "settings.theme.dark": "Dark",
    "settings.background.label": "Local background",
    "settings.background.none": "No background is active.",
    "settings.background.active": "A local background is active.",
    "settings.background.useBuiltIn": "Use background",
    "settings.background.chooseImage": "Choose image",
    "settings.background.reset": "Reset",
    "settings.background.error.unsupported_type": "Choose a PNG, JPEG, or WebP image.",
    "settings.background.error.too_large": "Choose an image smaller than 5 MB.",
    "item.action.complete": "Complete",
    "item.action.more": "More actions",
    "today.section.carriedForward": "Carried Forward",
    "today.section.today": "Today",
    "today.section.primaryRecommendations": "Primary Recommendations",
    "today.section.recommendedWork": "Recommended Work",
    "today.section.approachingDeadlines": "Approaching Deadlines",
    "today.section.ideasToRevisit": "Ideas to Revisit",
  },
  "zh-Hans": {
    "nav.today": "今日",
    "nav.inbox": "收件箱",
    "nav.upcoming": "即将到来",
    "nav.deadlines": "截止日期",
    "nav.ideas": "想法池",
    "nav.areas": "领域",
    "nav.completed": "已完成",
    "nav.archive": "归档",
    "nav.settings": "设置",
    "shell.primaryNavigation": "主导航",
    "quickAdd.button": "快速添加",
    "sync.placeholderDisconnected": "本地同步尚未连接",
    "page.today.description": "每日关注页面的平静占位。",
    "page.inbox.description": "捕获内容会先留在这里，等待分类。",
    "page.upcoming.description": "未来计划事项会按日期分组。",
    "page.deadlines.description": "围绕截止日期的计划会显示在这里。",
    "page.ideas.description": "想法会保持可见，但不会被当作失败的任务。",
    "page.areas.description": "领域管理和领域内计划会在这里展开。",
    "page.areaDetail.description": "{areaId} 的领域视图占位。",
    "page.completed.description": "已完成事项和重新打开操作会显示在这里。",
    "page.archive.description": "可恢复历史和归档事项会显示在这里。",
    "page.settings.description": "语言、时区和显示偏好会显示在这里。",
    "settings.appearance.title": "外观",
    "settings.appearance.description": "本地视觉偏好只保存在这台设备上。",
    "settings.theme.label": "主题",
    "settings.theme.description": "跟随系统主题，或选择固定模式。",
    "settings.theme.system": "跟随系统",
    "settings.theme.light": "浅色",
    "settings.theme.dark": "深色",
    "settings.background.label": "本地背景",
    "settings.background.none": "当前未启用背景。",
    "settings.background.active": "本地背景已启用。",
    "settings.background.useBuiltIn": "使用背景",
    "settings.background.chooseImage": "选择图片",
    "settings.background.reset": "重置",
    "settings.background.error.unsupported_type": "请选择 PNG、JPEG 或 WebP 图片。",
    "settings.background.error.too_large": "请选择小于 5 MB 的图片。",
    "item.action.complete": "完成",
    "item.action.more": "更多操作",
    "today.section.carriedForward": "延续事项",
    "today.section.today": "今日",
    "today.section.primaryRecommendations": "主要推荐",
    "today.section.recommendedWork": "推荐事项",
    "today.section.approachingDeadlines": "临近截止",
    "today.section.ideasToRevisit": "可回顾想法",
  },
  ja: {
    "nav.today": "今日",
    "nav.inbox": "受信箱",
    "nav.upcoming": "予定",
    "nav.deadlines": "締切",
    "nav.ideas": "アイデア",
    "nav.areas": "エリア",
    "nav.completed": "完了",
    "nav.archive": "アーカイブ",
    "nav.settings": "設定",
    "shell.primaryNavigation": "メインナビゲーション",
    "quickAdd.button": "クイック追加",
    "sync.placeholderDisconnected": "ローカル同期は未接続です",
    "page.today.description": "毎日の注意を整える画面のプレースホルダーです。",
    "page.inbox.description": "分類前のキャプチャはここに残ります。",
    "page.upcoming.description": "これからの予定は日付ごとにまとまります。",
    "page.deadlines.description": "締切に向けた計画がここに表示されます。",
    "page.ideas.description": "アイデアは失敗したタスクとして扱わず、見える場所に残します。",
    "page.areas.description": "エリア管理とエリア別の計画はここに入ります。",
    "page.areaDetail.description": "{areaId} のエリア別プレースホルダーです。",
    "page.completed.description": "完了した項目と再開操作がここに表示されます。",
    "page.archive.description": "復元できる履歴とアーカイブ項目がここに表示されます。",
    "page.settings.description": "言語、タイムゾーン、表示設定がここに入ります。",
    "settings.appearance.title": "表示",
    "settings.appearance.description": "ローカルの見た目設定はこの端末だけに保存されます。",
    "settings.theme.label": "テーマ",
    "settings.theme.description": "システム設定に合わせるか、固定モードを選びます。",
    "settings.theme.system": "システム",
    "settings.theme.light": "ライト",
    "settings.theme.dark": "ダーク",
    "settings.background.label": "ローカル背景",
    "settings.background.none": "背景は有効になっていません。",
    "settings.background.active": "ローカル背景が有効です。",
    "settings.background.useBuiltIn": "背景を使う",
    "settings.background.chooseImage": "画像を選択",
    "settings.background.reset": "リセット",
    "settings.background.error.unsupported_type": "PNG、JPEG、WebP の画像を選んでください。",
    "settings.background.error.too_large": "5 MB 未満の画像を選んでください。",
    "item.action.complete": "完了",
    "item.action.more": "その他の操作",
    "today.section.carriedForward": "持ち越し",
    "today.section.today": "今日",
    "today.section.primaryRecommendations": "主なおすすめ",
    "today.section.recommendedWork": "おすすめの作業",
    "today.section.approachingDeadlines": "近い締切",
    "today.section.ideasToRevisit": "見直すアイデア",
  },
};

export function detectLanguage(language = navigator.language): LanguageCode {
  if (language.startsWith("zh")) {
    return "zh-Hans";
  }

  if (language.startsWith("ja")) {
    return "ja";
  }

  const exactMatch = LANGUAGE_CODES.find((code) => code === language);

  return exactMatch ?? "en";
}

export function getDefaultLocale(language: LanguageCode) {
  return DEFAULT_LOCALES_BY_LANGUAGE[language];
}

export function formatMessage(template: string, values: MessageValues = {}) {
  return Object.entries(values).reduce(
    (message, [key, value]) => message.replaceAll(`{${key}}`, String(value)),
    template,
  );
}
