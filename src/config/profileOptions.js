// Must match milo-server/config/catalog.js: the server rejects anything not in these lists.
export const INTERESTS = [
  {label: 'Music', emoji: '🎵'}, {label: 'Movies', emoji: '🎬'}, {label: 'Cricket', emoji: '🏏'}, {label: 'Football', emoji: '⚽'},
  {label: 'Travel', emoji: '✈️'}, {label: 'Food', emoji: '🍜'}, {label: 'Cooking', emoji: '🍳'}, {label: 'Gaming', emoji: '🎮'},
  {label: 'Fitness', emoji: '💪'}, {label: 'Yoga', emoji: '🧘'}, {label: 'Dance', emoji: '💃'}, {label: 'Books', emoji: '📚'},
  {label: 'Bollywood', emoji: '🎭'}, {label: 'Web series', emoji: '📺'}, {label: 'Anime', emoji: '🍥'}, {label: 'Fashion', emoji: '👗'},
  {label: 'Photography', emoji: '📷'}, {label: 'Art', emoji: '🎨'}, {label: 'Tech', emoji: '💻'}, {label: 'Pets', emoji: '🐶'},
  {label: 'Comedy', emoji: '😂'}, {label: 'Spirituality', emoji: '🕉️'}, {label: 'Cars & bikes', emoji: '🏍️'}, {label: 'Startups', emoji: '🚀'},
];
export const MAX_INTERESTS = 5;

export const PROMPTS = [
  'My perfect Sunday is…',
  'I can talk for hours about…',
  'The way to win me over is…',
  'My go-to song right now is…',
  'A fun fact about me…',
  'My hidden talent is…',
  "The best trip I've taken…",
  'Ask me about…',
];
export const MAX_PROMPTS = 2;
export const MAX_PROMPT_ANSWER = 80;

const EMOJI = Object.fromEntries(INTERESTS.map(item => [item.label, item.emoji]));
export const interestEmoji = label => EMOJI[label] || '✨';
