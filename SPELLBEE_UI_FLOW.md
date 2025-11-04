# SpellBee Flash Trainer - UI Flow Guide

## 🎮 Game Screen Layout

```
┌─────────────────────────────────────────────────────────────┐
│                                                               │
│  ┌──────────────────┐  ← QUESTS PANEL (Top-Left, z-40)      │
│  │ 🎯 Daily Quests  │                                        │
│  │ ▼ [Expand/Collapse]                                      │
│  │                  │                                        │
│  │ 🪙 Earn 25 coins │    [=======>    ] 15/25               │
│  │ 🔥 Get 5-streak  │    [===         ] 3/5                 │
│  │                  │                                        │
│  └──────────────────┘                                        │
│                                                               │
│         ┌─────────────────────────────────┐                  │
│         │   🎉 Quest Complete! (Toast)   │  ← Celebration   │
│         └─────────────────────────────────┘                  │
│                                                               │
│  ┌────────┐    ┌──────────────────────┐    🪙 125  🔥 3     │
│  │← Back  │    │ 🐝 SpellBee Flash   │    Score: 42        │
│  └────────┘    │    Trainer           │                     │
│                └──────────────────────┘                     │
│                                                               │
│              ┌─────────────────────────────┐                 │
│              │                             │                 │
│              │      WORD CARD              │                 │
│              │   (Meaning/IPA MCQ)         │                 │
│              │                             │                 │
│              └─────────────────────────────┘                 │
│                                                               │
│           Progress: [=================>   ] 8/10             │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Summary Screen - Parent Report

```
┌─────────────────────────────────────────────────────────────┐
│                    GAME SUMMARY                              │
│                                                               │
│   🎉 Great Job! 🎉          Score: 18/20 (90%)              │
│                                                               │
│   ┌─────────────────────────────────────────────────┐       │
│   │        📊 Parent View [Toggle Button]           │       │
│   └─────────────────────────────────────────────────┘       │
│                                                               │
│   ┌─────────────────────────────────────────────────┐       │
│   │  📊 Progress Report for Parents                 │       │
│   │  ┌──────────┬──────────┬──────────┬──────────┐ │       │
│   │  │Accuracy  │Attempted │Best Streak│ Coins   │ │       │
│   │  │  90%     │    20    │     7     │   45    │ │       │
│   │  └──────────┴──────────┴──────────┴──────────┘ │       │
│   │                                                  │       │
│   │  ✅ Mastered Today:                             │       │
│   │  [cat] [dog] [run] [sun] ...                    │       │
│   │                                                  │       │
│   │  🎯 Tricky Phonemes:                            │       │
│   │  1. /æ/ (short a) - 3 wrong out of 5           │       │
│   │  2. /iː/ (long e) - 2 wrong out of 4           │       │
│   │                                                  │       │
│   │  💡 Practice Tip:                               │       │
│   │  Focus on short 'a' sound (/æ/) - words like   │       │
│   │  "cat", "hat", "mat"                            │       │
│   │                                                  │       │
│   │            📋 [Copy Report Button]              │       │
│   └─────────────────────────────────────────────────┘       │
│                                                               │
│   ┌─────────────┬─────────────┬─────────────┐              │
│   │ 🩹 Practice │ 🎮 Play     │ 🏠 Exit     │              │
│   │  Mistakes   │   Again     │             │              │
│   └─────────────┴─────────────┴─────────────┘              │
│                                                               │
│   ┌──────────────────────────────────────────┐              │
│   │  🎉 My Stickers (5/12) [Button]          │              │
│   └──────────────────────────────────────────┘              │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎉 Sticker Sheet Modal

```
┌─────────────────────────────────────────────────────────────┐
│  🎉 Sticker Sheet              🪙 125 coins      [X] Close  │
│  Collect and place stickers! (10 coins each)                │
│                                                               │
│  ┌──────────────────────┐  ┌──────────────────────┐        │
│  │   🛒 Shop            │  │  📋 Your Collection  │        │
│  │  ┌────┬────┬────┐   │  │                      │        │
│  │  │ 🌟 │ 🎨 │ 🚀 │   │  │  Select to place:    │        │
│  │  │    │    │    │   │  │  ┌─────────────────┐ │        │
│  │  └────┴────┴────┘   │  │  │ 🌟 🎨 🍕 🎮     │ │        │
│  │  ┌────┬────┬────┐   │  │  └─────────────────┘ │        │
│  │  │ 🦄 │ 🌈 │ 🎪 │   │  │                      │        │
│  │  │✓Own│    │    │   │  │  Placement Grid:     │        │
│  │  └────┴────┴────┘   │  │  ┌───┬───┬───┬───┐  │        │
│  │  ┌────┬────┬────┐   │  │  │🌟 │🎨 │   │ ➕ │  │        │
│  │  │ 🍕 │ 🎮 │ 🏆 │   │  │  ├───┼───┼───┼───┤  │        │
│  │  │✓Own│    │    │   │  │  │🍕 │   │ ➕ │ ➕ │  │        │
│  │  └────┴────┴────┘   │  │  ├───┼───┼───┼───┤  │        │
│  │  ┌────┬────┬────┐   │  │  │ ➕ │ ➕ │ ➕ │ ➕ │  │        │
│  │  │ 🎭 │ 🐉 │ 🎸 │   │  │  └───┴───┴───┴───┘  │        │
│  │  │    │✓Own│    │   │  │                      │        │
│  │  └────┴────┴────┘   │  │  "Click a slot to   │        │
│  │                      │  │   place sticker"    │        │
│  └──────────────────────┘  └──────────────────────┘        │
│                                                               │
│  ⚠️ Not enough coins! (Error Toast)                         │
│                                                               │
└─────────────────────────────────────────────────────────────┘

Legend:
- White border = Available for purchase
- Green border + "✓Own" = Already owned
- Purple highlight = Selected for placement
- ➕ = Empty slot (click to place)
- Emoji in slot = Placed sticker (click to remove)
```

---

## 🎯 Daily Quests Panel (Expanded)

```
┌──────────────────────────┐
│  🎯 Daily Quests    ▲    │  ← Click to collapse
├──────────────────────────┤
│                          │
│  🪙 Earn 25 coins        │
│  Progress:               │
│  [=========>     ] 15/25 │
│                          │
├──────────────────────────┤
│                          │
│  🔥 Get 5-streak     ✓   │  ← Completed (green)
│  Progress:               │
│  [==============] 5/5    │
│                          │
│  🎉 Quest Complete!      │  ← Celebration
│                          │
└──────────────────────────┘
```

---

## 📋 Copied Parent Report (Plain Text)

```
📊 SpellBee Session Report
Date: Jan 1, 2025, 3:45 PM

✅ Session Stats:
• Accuracy: 90%
• Attempted: 20 questions
• Best Streak: 7
• Coins Earned: 45

🌟 Mastered Today:
cat, dog, run, sun, fun, hat, mat, bat

🎯 Tricky Phonemes:
1. /æ/ (short a) - 3 wrong out of 5
2. /iː/ (long e) - 2 wrong out of 4

💡 Practice Tip:
Focus on short 'a' sound (/æ/) - words like "cat", "hat", "mat"

Keep up the great work! 🎉
```

---

## 🎮 User Journey Flow

```
Start Game
    ↓
┌───────────────────────────┐
│  1. Load Daily Quests     │ ← Check date, re-roll if new day
│  2. Initialize Coins      │
│  3. Show Quests Panel     │
└───────────────────────────┘
    ↓
┌───────────────────────────┐
│  Play Words 1-10          │
│  • Quest updates (coins)  │
│  • Quest updates (streak) │
│  • Quest updates (IPA)    │
│  • Quest celebration      │
└───────────────────────────┘
    ↓
┌───────────────────────────┐
│  Game Ends → Summary      │
│  1. Show score/badges     │
│  2. Build parent report   │
│  3. Load stickers         │
└───────────────────────────┘
    ↓
┌───────────────────────────┐
│  User Actions:            │
│  • View Parent Report     │
│  • Copy Report Text       │
│  • Open Sticker Sheet     │
│  • Purchase Stickers      │
│  • Place on Grid          │
│  • Play Again / Exit      │
└───────────────────────────┘
```

---

## 🔄 Quest Update Triggers

| Game Event          | Quest ID    | Trigger Location              |
|---------------------|-------------|-------------------------------|
| Earn coins          | `coins_25`  | After `addCoins()` call       |
| 5+ streak           | `streak_5`  | When `newStreak >= 5`         |
| Speed round win     | `speed_2`   | When `speedBonus === 3`       |
| IPA correct         | `ipa_3`     | When `correctIPA === true`    |
| Word mastered       | `master_3`  | When mastery bucket → 3       |
| Fix-up completed    | `fixup_1`   | After fix-up session ends     |

---

## 💾 LocalStorage Structure

```javascript
// Quest State (re-rolls daily)
localStorage.getItem("spellbee-quests-v1")
{
  date: "2025-01-01",  // YYYY-MM-DD
  quests: [
    { id: "coins_25", title: "Earn 25 coins", icon: "🪙", target: 25, progress: 15, done: false },
    { id: "streak_5", title: "Get 5-streak", icon: "🔥", target: 5, progress: 5, done: true }
  ]
}

// Parent Report (latest session)
localStorage.getItem("spellbee-report-v1")
{
  timestamp: "2025-01-01T15:45:30.123Z",
  sessionId: "abc123",
  accuracy: 90,
  attempted: 20,
  bestStreak: 7,
  coinsEarned: 45,
  masteredToday: ["cat", "dog", "run", ...],
  topTrickyPhonemes: [
    { phoneme: "/æ/", label: "short a", wrong: 3, seen: 5 }
  ],
  tip: "Focus on short 'a' sound (/æ/)..."
}

// Sticker Collection
localStorage.getItem("spellbee-stickers-v1")
{
  owned: ["🌟", "🎨", "🍕", "🐉"],  // Purchased stickers
  placed: ["🌟", "🎨", "", "", "🍕", "", "", "", "🐉", "", "", ""]  // 12-slot grid
}
```

---

## 🎨 Color Scheme Reference

### Quests Panel
- Header: Purple (#A855F7) → Pink (#EC4899) gradient
- Progress (in-progress): Purple → Pink gradient
- Progress (completed): Green (#10B981)
- Background: White with purple border

### Parent Report
- Panel: Blue (#3B82F6) → Indigo (#6366F1) gradient
- Cards: White with shadow
- Text: Indigo-700 (#4338CA)

### Stickers
- Button: Pink (#EC4899) → Yellow (#EAB308) gradient
- Shop items (available): White with purple border
- Shop items (owned): Green-100 background, green-400 border
- Grid (filled): Yellow-100 → Pink-100 gradient
- Grid (empty): Gray-100 background

---

## ✨ Animations

1. **Quest Panel**: Expand/collapse with smooth height transition
2. **Quest Celebration**: Bounce animation, 3-second display
3. **Sticker Selection**: Scale + ring on selected sticker
4. **Sticker Placement**: Fade-in when placed
5. **Copy Toast**: Slide-in from top, fade-out after 2s
6. **Confetti**: Fall animation on summary screen

---

This visual guide shows the complete UI layout and interaction flow for all three features!
