# Task 2 - Rebrand HermesFab to PUSPA AI Assistant

## Summary
Rebranded the `HermesFab` component from emerald "Hermes" styling to purple/violet "PUSPA AI Assistant" theme.

## Changes Made to `/home/z/my-project/src/components/hermes/hermes-fab.tsx`

1. **Shape**: `rounded-2xl` → `rounded-full` on button + pulse ring (circular FAB)
2. **Background gradient**: `#7c3aed → #9333ea → #6d28d9` (violet-600/purple range) replacing emerald
3. **Pulse ring**: `bg-violet-400/30` replacing `bg-emerald-400/30`
4. **Focus ring**: `focus:ring-violet-400` replacing `focus:ring-emerald-400`
5. **Icon**: `Flower2` (PUSPA flower) replacing `Sparkles`
6. **aria-label**: "Buka PUSPA AI" replacing "Buka Hermes AI"
7. **Green online dot**: Added in bottom-right corner when closed (ping + solid circle with white border)
8. **Provider indicator**: Moved to bottom-left (`-left-1`) to avoid overlap with green dot

## Preserved
- Same component name and export (`HermesFab`)
- Unread badge with red count
- All Framer Motion animations (spring entry, hover/tap scale, icon rotation transitions)
- AnimatePresence for smooth icon/badge transitions
