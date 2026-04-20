import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';
import type { FolderIcon } from '@/lib/sdk';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const PRESET_COLORS = [
  '#8b5cf6',
  '#6366f1',
  '#3b82f6',
  '#10b981',
  '#f59e0b',
  '#ef4444',
  '#ec4899',
  '#64748b',
];

export function IconPicker({
  value,
  onChange,
}: {
  value: FolderIcon;
  onChange: (icon: FolderIcon) => void;
}) {
  return (
    <Tabs defaultValue={value.type} className="w-[320px]">
      <TabsList className="w-full">
        <TabsTrigger value="emoji">Emoji</TabsTrigger>
        <TabsTrigger value="color">Color</TabsTrigger>
      </TabsList>

      <TabsContent value="emoji">
        <EmojiPicker
          lazyLoadEmojis
          emojiStyle={EmojiStyle.NATIVE}
          theme={Theme.AUTO}
          width="100%"
          height={360}
          onEmojiClick={(data) => onChange({ type: 'emoji', value: data.emoji })}
          previewConfig={{ showPreview: false }}
          skinTonesDisabled
        />
      </TabsContent>

      <TabsContent value="color">
        <div className="grid grid-cols-8 gap-1.5 py-2">
          {PRESET_COLORS.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => onChange({ type: 'color', value: c })}
              className="size-6 rounded-md ring-1 ring-black/10 transition-transform hover:scale-110"
              style={{ background: c }}
              aria-label={c}
            />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
