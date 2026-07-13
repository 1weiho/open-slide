import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { FolderIcon } from '@/lib/sdk';
import { useLocale } from '@/lib/use-locale';

export const PRESET_COLORS = [
  '#e5484d', // red
  '#f76b15', // orange
  '#ffb224', // amber
  '#30a46c', // green
  '#12a594', // teal
  '#0091ff', // blue
  '#6e56cf', // violet
  '#60646c', // gray
];

export function IconPicker({
  value,
  onChange,
}: {
  value: FolderIcon;
  onChange: (icon: FolderIcon) => void;
}) {
  const t = useLocale();
  return (
    <Tabs defaultValue={value.type} className="w-[320px]">
      <TabsList className="w-full">
        <TabsTrigger value="emoji">{t.home.iconEmojiTab}</TabsTrigger>
        <TabsTrigger value="color">{t.home.iconColorTab}</TabsTrigger>
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
              className="size-6 rounded-[4px] ring-1 ring-foreground/10 shadow-[inset_0_1px_0_oklch(1_0_0/0.18)] transition-transform hover:scale-110"
              style={{ background: c }}
              aria-label={c}
            />
          ))}
        </div>
      </TabsContent>
    </Tabs>
  );
}
