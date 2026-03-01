// إيموجي صقر الخاصة بالتطبيق للويب - ملصقات مربعة بدون خلفية
// Saqr Custom Stickers - Square format without background

// قائمة الإيموجي الجديدة (مربعة بدون خلفية)
export const SAQR_EMOJIS = [
  { 
    id: 'thumbsup', 
    name: 'أعجبني', 
    nameEn: 'Like',
    url: 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/f22b7d699297f76a166f1e960d062f79e7683bf0793eb49ebed98517bc4ac4be.png', 
    code: ':saqr_thumbsup:' 
  },
  { 
    id: 'love', 
    name: 'حب', 
    nameEn: 'Love',
    url: 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/1986500ba27ff6f8bc3238238c83c5a153cd88c6d06be7d21bde5759d04e8b74.png', 
    code: ':saqr_love:' 
  },
  { 
    id: 'laugh', 
    name: 'ضحك', 
    nameEn: 'Laugh',
    url: 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/ad26704f95a65c309b106a20abe826fffeddf3b546d7cb84212d8d8c27239fd2.png', 
    code: ':saqr_laugh:' 
  },
  { 
    id: 'sad', 
    name: 'حزين', 
    nameEn: 'Sad',
    url: 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/85503815583adf764d273a3c420c0bf8d5cb76ed9e6707a9ae47ee3c3f33f4ca.png', 
    code: ':saqr_sad:' 
  },
  { 
    id: 'cool', 
    name: 'كول', 
    nameEn: 'Cool',
    url: 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/a0fcd10be8e9d67e883f695ce00ed136e6d130347fb3e3853198894a50dae715.png', 
    code: ':saqr_cool:' 
  },
  { 
    id: 'wow', 
    name: 'واو', 
    nameEn: 'Wow',
    url: 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/104eaa1feb35860efe174495bb5b919b46395645b4923abf89a01199c9e12d28.png', 
    code: ':saqr_wow:' 
  },
  { 
    id: 'think', 
    name: 'تفكير', 
    nameEn: 'Think',
    url: 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/8af48afde2fd0a07cb8726c6d7f0a88466cd419e06709f1f4b065e895780e565.png', 
    code: ':saqr_think:' 
  },
  { 
    id: 'win', 
    name: 'فوز', 
    nameEn: 'Win',
    url: 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/a71a67e5191b570ad0a9c06dbc9db72140b663b6c7535f9fe79a7b0ccf1ba95a.png', 
    code: ':saqr_win:' 
  },
];

// تحويل الأكواد إلى عناصر
export const parseEmojiCodes = (text) => {
  const parts = [];
  let remaining = text;
  let key = 0;

  SAQR_EMOJIS.forEach(emoji => {
    const regex = new RegExp(emoji.code.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    remaining = remaining.replace(regex, `{{EMOJI:${emoji.id}}}`);
  });

  const segments = remaining.split(/({{EMOJI:\w+}})/);
  
  segments.forEach(segment => {
    const match = segment.match(/{{EMOJI:(\w+)}}/);
    if (match) {
      const emoji = SAQR_EMOJIS.find(e => e.id === match[1]);
      if (emoji) {
        parts.push({ type: 'emoji', url: emoji.url, id: emoji.id, key: key++ });
      }
    } else if (segment) {
      parts.push({ type: 'text', content: segment, key: key++ });
    }
  });

  return parts;
};

// الحصول على إيموجي بالـ ID
export const getEmojiById = (id) => {
  return SAQR_EMOJIS.find(e => e.id === id);
};

// الحصول على إيموجي بالكود
export const getEmojiByCode = (code) => {
  return SAQR_EMOJIS.find(e => e.code === code);
};

export default SAQR_EMOJIS;
