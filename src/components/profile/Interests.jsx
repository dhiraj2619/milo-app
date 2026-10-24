import React, {useState} from 'react';
import {Pressable, StyleSheet, Text, TextInput, View} from 'react-native';
import {Check, Plus, Quote, X} from 'lucide-react-native';
import {INTERESTS, MAX_INTERESTS, MAX_PROMPT_ANSWER, MAX_PROMPTS, PROMPTS, interestEmoji} from '../../config/profileOptions';

// Read-only interest chips, e.g. on profile cards and the call screen.
export function InterestChips({interests, max = MAX_INTERESTS, small = false, highlight = []}) {
  if (!interests?.length) return null;
  return <View style={styles.chips}>{interests.slice(0, max).map(item => {
    const shared = highlight.includes(item);
    return <View key={item} style={[styles.chip, small && styles.chipSmall, shared && styles.chipShared]}>
      <Text style={[styles.chipText, small && styles.chipTextSmall]}>{interestEmoji(item)} {item}</Text>
    </View>;
  })}</View>;
}

export function PromptCard({prompt, compact = false}) {
  return <View style={[styles.promptCard, compact && styles.promptCompact]}>
    <View style={styles.promptHead}><Quote size={13} color="#C99BFF" /><Text style={styles.promptQuestion}>{prompt.question}</Text></View>
    <Text style={[styles.promptAnswer, compact && styles.promptAnswerCompact]} numberOfLines={compact ? 2 : undefined}>{prompt.answer}</Text>
  </View>;
}

// Pick up to MAX_INTERESTS interests and answer up to MAX_PROMPTS prompts.
// `value` is {interests: string[], prompts: {question, answer}[]}; answers may be blank while editing.
export function InterestsEditor({value, onChange}) {
  const [choosingPrompt, setChoosingPrompt] = useState(false);
  const {interests, prompts} = value;
  const full = interests.length >= MAX_INTERESTS;
  const toggle = label => {
    const selected = interests.includes(label);
    if (!selected && full) return;
    onChange({...value, interests: selected ? interests.filter(item => item !== label) : [...interests, label]});
  };
  const setAnswer = (index, answer) => onChange({...value, prompts: prompts.map((item, i) => (i === index ? {...item, answer} : item))});
  const addPrompt = question => { setChoosingPrompt(false); onChange({...value, prompts: [...prompts, {question, answer: ''}]}); };
  const removePrompt = index => onChange({...value, prompts: prompts.filter((_, i) => i !== index)});
  const unused = PROMPTS.filter(question => !prompts.some(item => item.question === question));

  return <View>
    <View style={styles.labelRow}><Text style={styles.label}>Interests</Text><Text style={styles.counter}>{interests.length}/{MAX_INTERESTS}</Text></View>
    <View style={styles.chips}>{INTERESTS.map(({label, emoji}) => {
      const selected = interests.includes(label);
      return <Pressable key={label} accessibilityRole="checkbox" accessibilityState={{checked: selected, disabled: !selected && full}} onPress={() => toggle(label)}
        style={[styles.pick, selected && styles.pickOn, !selected && full && styles.pickDisabled]}>
        <Text style={styles.pickText}>{emoji} {label}</Text>
        {selected && <Check size={13} color="#FFF" strokeWidth={3} />}
      </Pressable>;
    })}</View>

    <View style={[styles.labelRow, styles.promptsLabel]}><Text style={styles.label}>Conversation starters <Text style={styles.optional}>(optional)</Text></Text><Text style={styles.counter}>{prompts.length}/{MAX_PROMPTS}</Text></View>
    <Text style={styles.hint}>Shown to people while your call connects, so they know what to talk about.</Text>
    {prompts.map((prompt, index) => <View key={prompt.question} style={styles.promptEdit}>
      <View style={styles.promptHead}>
        <Quote size={13} color="#C99BFF" /><Text style={[styles.promptQuestion, styles.flex]}>{prompt.question}</Text>
        <Pressable accessibilityRole="button" accessibilityLabel="Remove prompt" hitSlop={8} onPress={() => removePrompt(index)}><X size={16} color="#B9B1C5" /></Pressable>
      </View>
      <TextInput value={prompt.answer} onChangeText={text => setAnswer(index, text)} maxLength={MAX_PROMPT_ANSWER} placeholder="Your answer" placeholderTextColor="#7E768C" style={styles.answerInput} multiline />
      <Text style={styles.answerCount}>{prompt.answer.length}/{MAX_PROMPT_ANSWER}</Text>
    </View>)}
    {prompts.length < MAX_PROMPTS && (choosingPrompt
      ? <View style={styles.promptList}>{unused.map(question => <Pressable key={question} onPress={() => addPrompt(question)} style={styles.promptOption}><Text style={styles.promptOptionText}>{question}</Text></Pressable>)}
          <Pressable onPress={() => setChoosingPrompt(false)} style={styles.promptOption}><Text style={styles.cancelText}>Cancel</Text></Pressable></View>
      : <Pressable accessibilityRole="button" onPress={() => setChoosingPrompt(true)} style={styles.addPrompt}><Plus size={17} color="#E4C4FF" /><Text style={styles.addPromptText}>Add a prompt</Text></Pressable>)}
  </View>;
}

// For saving: drops prompts left blank. Returns an error message when something can't be saved.
export function readyToSave({interests, prompts}, {requireInterest = false} = {}) {
  if (requireInterest && !interests.length) return {error: 'Pick at least one interest.'};
  const filled = prompts.map(item => ({...item, answer: item.answer.trim()})).filter(item => item.answer);
  return {interests, prompts: filled};
}

const styles = StyleSheet.create({
  flex: {flex: 1},
  chips: {flexDirection: 'row', flexWrap: 'wrap', gap: 8},
  chip: {paddingHorizontal: 11, height: 30, borderRadius: 15, backgroundColor: 'rgba(139,64,238,0.18)', borderWidth: 1, borderColor: 'rgba(196,140,255,0.28)', justifyContent: 'center'},
  chipSmall: {paddingHorizontal: 8, height: 22, borderRadius: 11},
  chipShared: {borderColor: '#21E6A1', backgroundColor: 'rgba(33,230,161,0.14)'},
  chipText: {color: '#F2EAFE', fontFamily: 'Poppins-Medium', fontSize: 12},
  chipTextSmall: {fontSize: 10},
  promptCard: {borderRadius: 16, padding: 12, backgroundColor: 'rgba(18,4,54,0.72)', borderWidth: 1, borderColor: 'rgba(137,77,201,0.32)'},
  promptCompact: {padding: 10},
  promptHead: {flexDirection: 'row', alignItems: 'center', gap: 6},
  promptQuestion: {color: '#C99BFF', fontFamily: 'Poppins-Medium', fontSize: 12},
  promptAnswer: {color: '#FFFFFF', fontFamily: 'Poppins-SemiBold', fontSize: 15, marginTop: 4},
  promptAnswerCompact: {fontSize: 14},
  labelRow: {flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 10},
  promptsLabel: {marginTop: 24, marginBottom: 2},
  label: {color: '#F7F2FD', fontFamily: 'Poppins-SemiBold', fontSize: 15},
  optional: {color: '#B9B1C5', fontFamily: 'Poppins-Regular', fontSize: 12},
  counter: {color: '#B9B1C5', fontSize: 12},
  hint: {color: '#B9B1C5', fontFamily: 'Poppins-Regular', fontSize: 11.5, lineHeight: 16, marginBottom: 10},
  pick: {flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, height: 36, borderRadius: 18, borderWidth: 1, borderColor: '#38323F', backgroundColor: '#191820'},
  pickOn: {borderColor: '#9957FF', backgroundColor: '#3A1C6B'},
  pickDisabled: {opacity: 0.4},
  pickText: {color: '#F0EBF6', fontFamily: 'Poppins-Regular', fontSize: 13},
  promptEdit: {borderRadius: 16, padding: 12, marginBottom: 10, backgroundColor: '#17122A', borderWidth: 1, borderColor: '#3D2C5C'},
  answerInput: {color: '#FFFFFF', fontFamily: 'Poppins-Regular', fontSize: 14, minHeight: 40, paddingVertical: 6, paddingHorizontal: 0, textAlignVertical: 'top'},
  answerCount: {alignSelf: 'flex-end', color: '#7E768C', fontSize: 11},
  addPrompt: {minHeight: 46, borderRadius: 14, borderWidth: 1, borderStyle: 'dashed', borderColor: '#9C5CFF', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8},
  addPromptText: {color: '#E4C4FF', fontFamily: 'Poppins-Medium', fontSize: 14},
  promptList: {borderRadius: 14, borderWidth: 1, borderColor: '#3D2C5C', backgroundColor: '#17122A', overflow: 'hidden'},
  promptOption: {paddingVertical: 12, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: '#2A2140'},
  promptOptionText: {color: '#F2EAFE', fontFamily: 'Poppins-Regular', fontSize: 14},
  cancelText: {color: '#B9B1C5', fontFamily: 'Poppins-Medium', fontSize: 14, textAlign: 'center'},
});
