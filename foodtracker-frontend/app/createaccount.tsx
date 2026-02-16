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

export default function CreateAccount() {
  const { createAccount } = useSession();
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
  });

  const updateForm = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: '' }));
  };

  const validateForm = () => {
    const { firstName, lastName, email, password, confirmPassword } = formData;
    const newErrors = { firstName: '', lastName: '', email: '', password: '', confirmPassword: '' };

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!email.trim()) {
      newErrors.email = 'Email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        newErrors.email = 'Please enter a valid email address';
      }
    }

    if (!password.trim()) {
      newErrors.password = 'Password is required';
    } else {
      const passwordErrors = [];
      if (password.length < 8) {
        passwordErrors.push('at least 8 characters');
      }
      if (!/[A-Z]/.test(password)) {
        passwordErrors.push('uppercase letter');
      }
      if (!/[a-z]/.test(password)) {
        passwordErrors.push('lowercase letter');
      }
      if (!/\d/.test(password)) {
        passwordErrors.push('number');
      }
      if (passwordErrors.length > 0) {
        newErrors.password = `Must contain ${passwordErrors.join(', ')}`;
      }
    }

    if (!confirmPassword.trim()) {
      newErrors.confirmPassword = 'Confirm password is required';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return !Object.values(newErrors).some((err) => err !== '');
  };

  const handleSignUp = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await createAccount({
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password,
      });
    } catch (error) {
      setErrors((prev) => ({
        ...prev,
        email: error instanceof Error ? error.message : 'An unexpected error occurred',
      }));
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
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.content}>
          <ThemedText
            style={styles.title}
            lightColor={Colors.light.text}
            darkColor={Colors.dark.text}
          >
            Create Account
          </ThemedText>
          <ThemedText
            style={styles.subtitle}
            lightColor={Colors.light.icon}
            darkColor={Colors.dark.icon}
          >
            Track calories today
          </ThemedText>

          <View style={styles.form}>
            <View style={styles.row}>
              <View
                style={[styles.inputContainer, { flex: 1, marginRight: 8 }]}
              >
                <ThemedText
                  style={styles.label}
                  lightColor={Colors.light.text}
                  darkColor={Colors.dark.text}
                >
                  First Name
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.modal,
                      borderColor: colors.modalSecondary,
                      color: colors.text,
                    },
                    errors.firstName && styles.inputError,
                  ]}
                  value={formData.firstName}
                  onChangeText={(value) => updateForm('firstName', value)}
                  placeholder="First name"
                  placeholderTextColor={colors.icon}
                  selectionColor={colors.tint}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                {errors.firstName && (
                  <ThemedText style={styles.errorText}>{errors.firstName}</ThemedText>
                )}
              </View>

              <View style={[styles.inputContainer, { flex: 1, marginLeft: 8 }]}>
                <ThemedText
                  style={styles.label}
                  lightColor={Colors.light.text}
                  darkColor={Colors.dark.text}
                >
                  Last Name
                </ThemedText>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.modal,
                      borderColor: colors.modalSecondary,
                      color: colors.text,
                    },
                    errors.lastName && styles.inputError,
                  ]}
                  value={formData.lastName}
                  onChangeText={(value) => updateForm('lastName', value)}
                  placeholder="Last name"
                  placeholderTextColor={colors.icon}
                  selectionColor={colors.tint}
                  autoCapitalize="words"
                  autoCorrect={false}
                  editable={!isLoading}
                />
                {errors.lastName && (
                  <ThemedText style={styles.errorText}>{errors.lastName}</ThemedText>
                )}
              </View>
            </View>

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
                  errors.email && styles.inputError,
                ]}
                value={formData.email}
                onChangeText={(value) => updateForm('email', value)}
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
              {errors.email && (
                <ThemedText style={styles.errorText}>{errors.email}</ThemedText>
              )}
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
                  errors.password && styles.inputError,
                ]}
                value={formData.password}
                onChangeText={(value) => updateForm('password', value)}
                placeholder="Enter your password"
                placeholderTextColor={colors.icon}
                selectionColor={colors.tint}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                textContentType="newPassword"
                autoComplete="new-password"
                passwordRules="minlength: 8; required: upper; required: lower; required: digit;"
              />
              {errors.password ? (
                <ThemedText style={styles.errorText}>{errors.password}</ThemedText>
              ) : (
                <ThemedText
                  style={styles.helperText}
                  lightColor={Colors.light.icon}
                  darkColor={Colors.dark.icon}
                >
                  At least 8 characters with uppercase, lowercase, and a number
                </ThemedText>
              )}
            </View>

            <View style={styles.inputContainer}>
              <ThemedText
                style={styles.label}
                lightColor={Colors.light.text}
                darkColor={Colors.dark.text}
              >
                Confirm Password
              </ThemedText>
              <TextInput
                style={[
                  styles.input,
                  {
                    backgroundColor: colors.modal,
                    borderColor: colors.modalSecondary,
                    color: colors.text,
                  },
                  errors.confirmPassword && styles.inputError,
                ]}
                value={formData.confirmPassword}
                onChangeText={(value) => updateForm('confirmPassword', value)}
                placeholder="Confirm your password"
                placeholderTextColor={colors.icon}
                selectionColor={colors.tint}
                secureTextEntry
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                textContentType="newPassword"
                autoComplete="new-password"
                passwordRules="minlength: 8; required: upper; required: lower; required: digit;"
              />
              {errors.confirmPassword && (
                <ThemedText style={styles.errorText}>{errors.confirmPassword}</ThemedText>
              )}
            </View>

            <TouchableOpacity
              style={[
                styles.signUpButton,
                { backgroundColor: colors.tint },
                isLoading && [
                  styles.disabledButton,
                  { backgroundColor: colors.modalSecondary },
                ],
              ]}
              onPress={handleSignUp}
              disabled={isLoading}
            >
              <ThemedText style={styles.signUpButtonText}>
                {isLoading ? 'Creating Account...' : 'Create Account'}
              </ThemedText>
            </TouchableOpacity>
          </View>

          <View style={styles.footer}>
            <ThemedText
              style={styles.footerText}
              lightColor={Colors.light.icon}
              darkColor={Colors.dark.icon}
            >
              Already have an account?{' '}
            </ThemedText>
            <TouchableOpacity onPress={() => router.push('/signin')}>
              <ThemedText
                style={styles.signInLink}
                lightColor={Colors.light.tint}
                darkColor={Colors.dark.tint}
              >
                Sign In
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
    minHeight: '100%',
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
  row: {
    flexDirection: 'row',
    marginBottom: 4,
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
  inputError: {
    borderColor: '#ff3b30',
    borderWidth: 2,
    backgroundColor: '#fff5f5',
  },
  errorText: {
    fontSize: 12,
    color: '#ff3b30',
    marginTop: 4,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: 4,
  },
  signUpButton: {
    width: '100%',
    height: 50,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
  },
  disabledButton: {},
  signUpButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
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
  signInLink: {
    fontSize: 16,
    fontWeight: '600',
  },
});
