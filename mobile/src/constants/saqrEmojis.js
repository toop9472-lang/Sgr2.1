// إيموجي صقر الخاصة بالتطبيق
// Saqr Custom Emojis - Used across all chat interfaces

// قائمة الإيموجي
export const SAQR_EMOJIS = [
  { 
    id: 'thumbsup', 
    name: 'أعجبني', 
    nameEn: 'Like',
    url: 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/4d62725e93babb5fe8ec023f841834fe43aecf6361ef5bf793c75b94b1b5e20d.png', 
    code: ':saqr_thumbsup:' 
  },
  { 
    id: 'love', 
    name: 'حب', 
    nameEn: 'Love',
    url: 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/6580ae2a5333cd4a0f2787e85ab783d07cc5261beecc9f9304a2b637a048b7a7.png', 
    code: ':saqr_love:' 
  },
  { 
    id: 'laugh', 
    name: 'ضحك', 
    nameEn: 'Laugh',
    url: 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/9722ea13091c46c14aec75a1a36ffb6b0dad77eeda8254f0a11e0fbf196288e9.png', 
    code: ':saqr_laugh:' 
  },
  { 
    id: 'sad', 
    name: 'حزين', 
    nameEn: 'Sad',
    url: 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/245522f2b2b34d3062879420cdb77fe5af504615844ad07a91cb95c0cd7c7d79.png', 
    code: ':saqr_sad:' 
  },
  { 
    id: 'cool', 
    name: 'كول', 
    nameEn: 'Cool',
    url: 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/d4d238b8ddb24961fc823e4eb44d26bde7a0b4506bb25ad70a3794c5689a5c06.png', 
    code: ':saqr_cool:' 
  },
  { 
    id: 'wow', 
    name: 'واو', 
    nameEn: 'Wow',
    url: 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/093a29ed69c6ec8128f3f97247b9273943080bf9d3735605f2b063670e2666e7.png', 
    code: ':saqr_wow:' 
  },
  { 
    id: 'think', 
    name: 'تفكير', 
    nameEn: 'Think',
    url: 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/4a8a1d2bb75e0d70313d691c5500779575c0d25d0f729fa30a3960000eb25da5.png', 
    code: ':saqr_think:' 
  },
  { 
    id: 'win', 
    name: 'فوز', 
    nameEn: 'Win',
    url: 'https://static.prod-images.emergentagent.com/jobs/e23d200c-4b60-4ee7-aeca-e6db4f28f9dd/images/a4d252dd324e9a46c6165c934a67e15f6d42700b34b495fdcfc05203d3f6d74b.png', 
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
