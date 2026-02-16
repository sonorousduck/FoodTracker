import ThemedText from '@/components/themedtext';
import { Colors } from '@/constants/Colors';
import { useSession } from '@/hooks/auth';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  useColorScheme,
  View,
} from 'react-native';

export default function SignIn() {
  const { signIn } = useSession();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [formError, setFormError] = useState('');

  const handleSignIn = async () => {
    if (!email.trim() || !password.trim()) {
      setFormError('Please fill in all fields');
      return;
    }

    setFormError('');
    setIsLoading(true);

    try {
      const result = await signIn({ email, password });
      if (result.accessToken) {
        // Navigate after successful sign-in
        router.replace('/');
      } else {
        setFormError('Sign in failed. Please try again.');
      }
    } catch (error) {
      setFormError(
        error instanceof Error ? error.message : 'An unexpected error occurred',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.content}>
          <ThemedText
            style={styles.title}
            lightColor={Colors.light.text}
            darkColor={Colors.dark.text}
          >
            Welcome Back
          </ThemedText>
          <ThemedText
            style={styles.subtitle}
            lightColor={Colors.light.icon}
            darkColor={Colors.dark.icon}
          >
            Sign in to your account
          </ThemedText>

          <View style={styles.form}>
            <View style={styles.inputContainer}>
              <ThemedText
                style={styles.label}
                lightColor={Colors.light.text}
                darkColor={Colors.dark.text}
              >
                Email
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.modal,
                    borderColor: colors.modalSecondary,
                    color: colors.text,
                  },
                ]}
                value={email}
                onChangeText={(value) => {
                  setEmail(value);
                  setFormError('');
                }}
                placeholder="Enter your email"
                placeholderTextColor={colors.icon}
                selectionColor={colors.tint}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                textContentType="emailAddress"
                autoComplete="email"
              />
            </View>

            <View style={styles.inputContainer}>
              <ThemedText
                style={styles.label}
                lightColor={Colors.light.text}
                darkColor={Colors.dark.text}
              >
                Password
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.modal,
                    borderColor: colors.modalSecondary,
                    color: colors.text,
                  },
                ]}
                value={password}
                onChangeText={(value) => {
                  setPassword(value);
                  setFormError('');
                }}
                placeholder="Enter your password"
                placeholderTextColor={colors.icon}
                selectionColor={colors.tint}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                textContentType="password"
                autoComplete="current-password"
              />
            </View>

            {formError && (
              <ThemedText style={styles.errorText}>{formError}</ThemedText>
            )}

            <TouchableOpacity
              style={[
                styles.signInButton,
                { backgroundColor: colors.tint },
                isLoading && [
                  styles.disabledButton,
                  { backgroundColor: colors.modalSecondary },
                ],
              ]}
              onPress={handleSignIn}
              disabled={isLoading}
            >
              <ThemedText style={styles.signInButtonText}>
                {isLoading ? 'Signing In...' : 'Sign In'}
              </ThemedText>
            </TouchableOpacity>

            <TouchableOpacity style={styles.forgotPasswordButton}>
              <ThemedText
                style={styles.forgotPasswordText}
                lightColor={Colors.light.tint}
                darkColor={Colors.dark.tint}
              >
                Forgot Password?
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <ThemedText
              style={styles.footerText}
              lightColor={Colors.light.icon}
              darkColor={Colors.dark.icon}
            >
              Don&apos;t have an account?{' '}
            </ThemedText>
            <TouchableOpacity onPress={() => router.replace('/createaccount')}>
              <ThemedText
                style={styles.signUpLink}
                lightColor={Colors.light.tint}
                darkColor={Colors.dark.tint}
              >
                Sign Up
              </ThemedText>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 48,
  },
  form: {
    width: '100%',
  },
  inputContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
  },
  errorText: {
    fontSize: 12,
    color: '#ff3b30',
    marginBottom: 16,
    marginLeft: 4,
  },
  signInButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    marginBottom: 16,
  },
  disabledButton: {},
  signInButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  forgotPasswordButton: {
    alignSelf: 'center',
  },
  forgotPasswordText: {
    fontSize: 16,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 32,
  },
  footerText: {
    fontSize: 16,
  },
  signUpLink: {
    fontSize: 16,
    fontWeight: '600',
  },
});
