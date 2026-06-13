import { createI18n } from 'vue-i18n';

// 导入翻译文件
import en from '@/locales/en';
import zhHans from '@/locales/zh-hans';
import zhHant from '@/locales/zh-hant';
import jp from '@/locales/jp'

// 创建 i18n 实例
const i18n = createI18n({
  locale: 'zh-Hans', // 默认语言
  // 或者可以获取用户浏览器语言
  // const userLang = navigator.language || 'en-US'; 
  // fallbackLocale: 'en-US', // 备用语言
  messages: {
    'en-US': {
        ...en
    },
    'zh-Hans': {
        ...zhHans
    },
    'zh-Hant': {
        ...zhHant
    },
    'jp':{
        ...jp
    }
  },
});

export default i18n;
