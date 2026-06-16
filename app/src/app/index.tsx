import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  Dimensions,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { Sparkles, Moon, Droplet, CheckSquare, Heart, Mail, Lock } from 'lucide-react-native';
import { API_URL } from '@/constants/api';

const { width } = Dimensions.get('window');

const SLIDES = [
  {
    icon: <Sparkles color="#A855F7" size={54} />,
    title: 'Meet Aurora',
    desc: 'Your intelligent personal health companion designed to understand you better every day.',
  },
  {
    icon: <Droplet color="#06B6D4" size={54} />,
    title: 'Track Hydration & Nutrition',
    desc: 'Fill your virtual water bottle, log meals easily, and understand eating patterns through AI insights.',
  },
  {
    icon: <Moon color="#3B82F6" size={54} />,
    title: 'Monitor Sleep Cycles',
    desc: 'Record hours, log quality ratings, and analyze sleep trends to discover what helps you wake refreshed.',
  },
  {
    icon: <CheckSquare color="#10B981" size={54} />,
    title: 'Form Strong Habits',
    desc: 'Establish healthy routines, track streaks, and build daily consistency.',
  },
  {
    icon: <Heart color="#EC4899" size={54} />,
    title: 'Personalized AI Agent',
    desc: 'Have natural voice conversations with Aurora to update your logs and get tailored advice.',
  },
];

export default function IndexLandingScreen() {
  const [slideIndex, setSlideIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuth, setShowAuth] = useState(false);
  
  // Auth state inputs
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSignUp, setIsSignUp] = useState(false);

  // Check if user is already onboarded
  useEffect(() => {
    async function checkUser() {
      try {
        const res = await fetch(`${API_URL}/user`);
        const data = await res.json();
        if (data.success && data.user) {
          console.log('User already onboarded, redirecting to dashboard...');
          router.replace('/(tabs)/dashboard');
        } else {
          setIsLoading(false);
        }
      } catch (e) {
        console.warn('Backend checking failed, showing landing screen:', e);
        setIsLoading(false);
      }
    }
    checkUser();
  }, []);

  const nextSlide = () => {
    if (slideIndex < SLIDES.length - 1) {
      setSlideIndex(slideIndex + 1);
    } else {
      setShowAuth(true);
    }
  };

  const handleAuthSubmit = () => {
    if (!email.trim() || !password.trim()) {
      Alert.alert('Required', 'Please fill in both email and password.');
      return;
    }
    if (!email.includes('@')) {
      Alert.alert('Invalid Email', 'Please enter a valid email address.');
      return;
    }
    // Simulate login and go to onboarding questionnaire
    router.replace('/onboarding');
  };

  const handleSSOLogin = (provider: string) => {
    console.log(`SSO Login via ${provider}`);
    // Simulate and proceed to onboarding
    router.replace('/onboarding');
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A855F7" />
      </View>
    );
  }

  const currentSlide = SLIDES[slideIndex];

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={['#0F0A24', '#060312']}
        style={styles.gradient}
      >
        {/* Glow effect */}
        <View style={styles.glowOrb} />

        <View style={styles.header}>
          <Text style={styles.logoText}>AURORA</Text>
          <Text style={styles.tagline}>Understand yourself better every day.</Text>
        </View>

        {!showAuth ? (
          <>
            {/* Slider Content */}
            <View style={styles.slideContainer}>
              <View style={styles.iconCircle}>
                {currentSlide.icon}
              </View>
              <Text style={styles.slideTitle}>{currentSlide.title}</Text>
              <Text style={styles.slideDesc}>{currentSlide.desc}</Text>
            </View>

            {/* Slider Indicator */}
            <View style={styles.indicatorRow}>
              {SLIDES.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.indicator,
                    index === slideIndex && styles.indicatorActive,
                  ]}
                />
              ))}
            </View>

            {/* Button */}
            <View style={styles.footer}>
              <TouchableOpacity style={styles.button} onPress={nextSlide}>
                <LinearGradient
                  colors={['#8B5CF6', '#EC4899']}
                  style={styles.btnGradient}
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 0 }}
                >
                  <Text style={styles.buttonText}>
                    {slideIndex === SLIDES.length - 1 ? 'Get Started' : 'Next'}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          </>
        ) : (
          /* Authentication Screen panel */
          <View style={styles.authContainer}>
            <Text style={styles.authTitle}>{isSignUp ? 'Create your Account' : 'Welcome Back'}</Text>
            <Text style={styles.authSub}>Access your health companion</Text>

            {/* Inputs */}
            <View style={styles.inputContainer}>
              <Mail color="#6B7280" size={18} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                placeholderTextColor="#6B7280"
                keyboardType="email-address"
                autoCapitalize="none"
                value={email}
                onChangeText={setEmail}
              />
            </View>

            <View style={styles.inputContainer}>
              <Lock color="#6B7280" size={18} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                placeholder="Password"
                placeholderTextColor="#6B7280"
                secureTextEntry
                autoCapitalize="none"
                value={password}
                onChangeText={setPassword}
              />
            </View>

            <TouchableOpacity style={styles.authBtn} onPress={handleAuthSubmit}>
              <LinearGradient
                colors={['#8B5CF6', '#EC4899']}
                style={styles.btnGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
              >
                <Text style={styles.buttonText}>{isSignUp ? 'Sign Up' : 'Sign In'}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.toggleAuthRow} 
              onPress={() => setIsSignUp(!isSignUp)}
            >
              <Text style={styles.toggleAuthText}>
                {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </Text>
            </TouchableOpacity>

            <View style={styles.orRow}>
              <View style={styles.orLine} />
              <Text style={styles.orText}>OR</Text>
              <View style={styles.orLine} />
            </View>

            {/* Social Logins */}
            <TouchableOpacity 
              style={styles.socialBtn} 
              onPress={() => handleSSOLogin('Google')}
            >
              <Text style={styles.socialBtnText}>Continue with Google</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.socialBtn} 
              onPress={() => handleSSOLogin('Apple')}
            >
              <Text style={styles.socialBtnText}>Continue with Apple</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.cancelAuthBtn} 
              onPress={() => setShowAuth(false)}
            >
              <Text style={styles.cancelAuthText}>Back to Slides</Text>
            </TouchableOpacity>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0C081A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gradient: {
    flex: 1,
    paddingHorizontal: 30,
    justifyContent: 'space-between',
    paddingTop: 80,
    paddingBottom: 60,
  },
  glowOrb: {
    position: 'absolute',
    top: 100,
    right: -50,
    width: 250,
    height: 250,
    borderRadius: 125,
    backgroundColor: 'rgba(168, 85, 247, 0.15)',
    filter: 'blur(50px)',
  },
  header: {
    alignItems: 'center',
  },
  logoText: {
    fontSize: 36,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 4,
    textShadowColor: 'rgba(168, 85, 247, 0.5)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 15,
  },
  tagline: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 8,
    textAlign: 'center',
    fontWeight: '500',
  },
  slideContainer: {
    alignItems: 'center',
    paddingHorizontal: 20,
    marginVertical: 40,
  },
  iconCircle: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: 'rgba(21, 16, 38, 0.8)',
    borderWidth: 1,
    borderColor: '#2D264F',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
  },
  slideTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  slideDesc: {
    fontSize: 15,
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 24,
  },
  indicatorRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  indicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#2D264F',
    marginHorizontal: 4,
  },
  indicatorActive: {
    backgroundColor: '#EC4899',
    width: 24,
  },
  footer: {
    alignItems: 'center',
  },
  button: {
    width: '100%',
    height: 56,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#EC4899',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 6,
  },
  btnGradient: {
    flex: 1,
    width: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  authContainer: {
    backgroundColor: '#151026',
    borderWidth: 1,
    borderColor: '#251F41',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    marginVertical: 20,
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 15,
    elevation: 8,
  },
  authTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  authSub: {
    fontSize: 13,
    color: '#9CA3AF',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 20,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1F1A3A',
    borderWidth: 1,
    borderColor: '#2D264F',
    borderRadius: 12,
    paddingHorizontal: 14,
    height: 50,
    marginBottom: 12,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: '#FFFFFF',
  },
  authBtn: {
    height: 50,
    borderRadius: 12,
    overflow: 'hidden',
    marginTop: 10,
  },
  toggleAuthRow: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  toggleAuthText: {
    color: '#EC4899',
    fontSize: 13,
    fontWeight: '600',
  },
  orRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 8,
  },
  orLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#2D264F',
  },
  orText: {
    color: '#6B7280',
    marginHorizontal: 12,
    fontSize: 11,
    fontWeight: '600',
  },
  socialBtn: {
    height: 48,
    backgroundColor: '#1A1530',
    borderWidth: 1,
    borderColor: '#2D264F',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  socialBtnText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  cancelAuthBtn: {
    alignItems: 'center',
    paddingVertical: 8,
    marginTop: 6,
  },
  cancelAuthText: {
    color: '#6B7280',
    fontSize: 13,
  },
});
