import EmojiPicker, { EmojiStyle, Theme } from 'emoji-picker-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { FolderIcon } from '@/lib/sdk';

// Editorial palette — restrained warm/earth tones, no shadcn defaults
// (no #8b5cf6 violet, no #3b82f6 blue, etc.). Picked to coexist with the
// vermillion brand accent without shouting over it.
export const PRESET_COLORS = [
  '#c0392b', // vermillion
  '#b8743e', // ochre
  '#6f7a3a', // olive
  '#2f6a4f', // forest
  '#3a5a7c', // ink blue
  '#6b4675', // plum
  '#a3543b', // terracotta
  '#3a3a3a', // graphite
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
