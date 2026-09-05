import { StyleSheet } from 'react-native';
import colors from '../theme/colors';
import typography from '../theme/typography';

const globalStyles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    ...typography.h1,
    color: colors.textPrimary,
  },

  subtitle: {
    ...typography.body,
    color: colors.textSecondary,
    marginTop: 8,
  },
});

export default globalStyles;
