import { useEffect, useState } from 'react';

const EMOJIS = ['🐍', '🚀', '👨‍💻', '👩‍💻', '👨‍🎨', '👩‍🎨'];

export const useEmojiLoading = ({ loading = false }: { loading?: boolean }) => {
  const [emoji, setEmoji] = useState(EMOJIS[0]);

  useEffect(() => {
    if (loading) {
      const timeout = setTimeout(() => {
        const index = EMOJIS.indexOf(emoji);
        const nextIndex = (index + 1) % EMOJIS.length;
        setEmoji(EMOJIS[nextIndex]);
      }, 300);

      return () => clearTimeout(timeout);
    }

    setEmoji(EMOJIS[0]);
  }, [loading, emoji]);

  return emoji;
};
