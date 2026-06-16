import React, { useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { router } from 'expo-router';
import { ArrowRight, Sparkles, Check } from 'lucide-react-native';
import { API_URL } from '@/constants/api';

const GOALS = [
  { id: 'Improve Hydration', title: 'Improve Hydration', desc: 'Drink enough water daily' },
  { id: 'Sleep Better', title: 'Sleep Better', desc: 'Enhance consistency & rest' },
  { id: 'Build Better Habits', title: 'Build Better Habits', desc: 'Read, meditate, or exercise' },
  { id: 'Eat Healthier', title: 'Eat Healthier', desc: 'Log nutrition and balance macros' },
  { id: 'Improve Energy Levels', title: 'Boost Energy', desc: 'Wake up refreshed' },
];

export default function OnboardingScreen() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState('');
  const [age, setAge] = useState('');
  const [gender, setGender] = useState('other');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [bedTime, setBedTime] = useState('22:30');
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleGoal = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      setSelectedGoals(selectedGoals.filter(id => id !== goalId));
    } else {
      setSelectedGoals([...selectedGoals, goalId]);
    }
  };

  const handleNext = () => {
    if (step === 1 && !name.trim()) {
      Alert.alert('Required', 'Please enter your name.');
      return;
    }
    if (step === 2 && (!age || !height || !weight)) {
      Alert.alert('Required', 'Please fill in age, height, and weight.');
      return;
    }
    if (step === 3 && selectedGoals.length === 0) {
      Alert.alert('Goals Required', 'Please select at least one goal.');
      return;
    }
    
    if (step < 4) {
      setStep(step + 1);
    } else {
      submitOnboarding();
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const submitOnboarding = async () => {
    setIsSubmitting(true);
    const payload = {
      name,
      age: parseInt(age),
      gender,
      height: parseFloat(height),
      weight: parseFloat(weight),
      wake_time: wakeTime,
      bed_time: bedTime,
      goals: selectedGoals,
      notifications: {
        hydration: true,
        sleep: true,
        habits: true,
        insights: true,
      },
    };

    try {
      console.log('Submitting onboarding data:', payload);
      const response = await fetch(`${API_URL}/onboarding`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      console.log('Onboarding response:', data);
      
      if (data.success) {
        // Complete onboarding and navigate to dashboard
        router.replace('/(tabs)/dashboard');
      } else {
        Alert.alert('Error', data.error || 'Failed to submit onboarding.');
      }
    } catch (e) {
      console.warn('Network request failed, using offline fallback:', e);
      // Fallback: Continue offline
      router.replace('/(tabs)/dashboard');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <LinearGradient
        colors={['#0F0A24', '#070414']}
        style={styles.gradient}
      >
        <View style={styles.header}>
          <Text style={styles.title}>Let's Set Up Aurora</Text>
          <Text style={styles.subtitle}>Step {step} of 4</Text>
          <View style={styles.progressContainer}>
            <View style={[styles.progressBar, { width: `${step * 25}%` }]} />
          </View>
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          {step === 1 && (
            <View style={styles.stepContainer}>
              <View style={styles.iconContainer}>
                <Sparkles color="#A855F7" size={40} />
              </View>
              <Text style={styles.stepTitle}>What should we call you?</Text>
              <Text style={styles.stepDesc}>Aurora will address you by this name.</Text>
              
              <TextInput
                style={styles.input}
                placeholder="Enter your name"
                placeholderTextColor="#6B7280"
                value={name}
                onChangeText={setName}
                autoFocus
              />
            </View>
          )}

          {step === 2 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Tell us about yourself</Text>
              <Text style={styles.stepDesc}>Used to calculate hydration limits and resting sleep guidelines.</Text>
              
              <Text style={styles.label}>Age (years)</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. 28"
                placeholderTextColor="#6B7280"
                keyboardType="numeric"
                value={age}
                onChangeText={setAge}
              />

              <Text style={styles.label}>Gender</Text>
              <View style={styles.row}>
                {['male', 'female', 'other'].map(g => (
                  <TouchableOpacity
                    key={g}
                    style={[styles.chip, gender === g && styles.chipActive]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={[styles.chipText, gender === g && styles.chipTextActive]}>
                      {g.charAt(0).toUpperCase() + g.slice(1)}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <View style={[styles.row, { marginTop: 12 }]}>
                <View style={{ flex: 1, marginRight: 8 }}>
                  <Text style={styles.label}>Height (cm)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 175"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    value={height}
                    onChangeText={setHeight}
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 8 }}>
                  <Text style={styles.label}>Weight (kg)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 70"
                    placeholderTextColor="#6B7280"
                    keyboardType="numeric"
                    value={weight}
                    onChangeText={setWeight}
                  />
                </View>
              </View>
            </View>
          )}

          {step === 3 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>What are your health goals?</Text>
              <Text style={styles.stepDesc}>Select all that apply. Aurora will tailor your tips.</Text>
              
              {GOALS.map(goal => {
                const isSelected = selectedGoals.includes(goal.id);
                return (
                  <TouchableOpacity
                    key={goal.id}
                    style={[styles.goalCard, isSelected && styles.goalCardActive]}
                    onPress={() => toggleGoal(goal.id)}
                  >
                    <View style={{ flex: 1 }}>
                      <Text style={styles.goalTitle}>{goal.title}</Text>
                      <Text style={styles.goalDesc}>{goal.desc}</Text>
                    </View>
                    <View style={[styles.checkbox, isSelected && styles.checkboxActive]}>
                      {isSelected && <Check color="#FFFFFF" size={14} />}
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          )}

          {step === 4 && (
            <View style={styles.stepContainer}>
              <Text style={styles.stepTitle}>Routine schedule</Text>
              <Text style={styles.stepDesc}>Used to calibrate notifications and sleep metrics.</Text>

              <Text style={styles.label}>Target Wake-up Time</Text>
              <TextInput
                style={styles.input}
                placeholder="07:00"
                placeholderTextColor="#6B7280"
                value={wakeTime}
                onChangeText={setWakeTime}
              />

              <Text style={styles.label}>Target Bedtime</Text>
              <TextInput
                style={styles.input}
                placeholder="22:30"
                placeholderTextColor="#6B7280"
                value={bedTime}
                onChangeText={setBedTime}
              />

              <View style={styles.infoBox}>
                <Text style={styles.infoBoxText}>
                  ✨ Aurora will check in with you 30 minutes before bedtime and send a gentle reminder to sleep.
                </Text>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={styles.footer}>
          {step > 1 && (
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Text style={styles.backButtonText}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity 
            style={[styles.nextButton, { marginLeft: step > 1 ? 12 : 0 }]} 
            onPress={handleNext}
            disabled={isSubmitting}
          >
            <LinearGradient
              colors={['#8B5CF6', '#EC4899']}
              style={styles.nextGradient}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
            >
              <Text style={styles.nextButtonText}>
                {step === 4 ? (isSubmitting ? 'Configuring...' : 'Launch Aurora') : 'Continue'}
              </Text>
              <ArrowRight color="#FFFFFF" size={18} />
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </LinearGradient>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  gradient: {
    flex: 1,
    paddingTop: 60,
    paddingHorizontal: 20,
  },
  header: {
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  subtitle: {
    fontSize: 14,
    color: '#A855F7',
    marginTop: 4,
    fontWeight: '600',
  },
  progressContainer: {
    height: 4,
    backgroundColor: '#1F1A3A',
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#A855F7',
  },
  scrollContent: {
    paddingBottom: 40,
  },
  stepContainer: {
    marginTop: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#1E1548',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    alignSelf: 'center',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  stepDesc: {
    fontSize: 14,
    color: '#9CA3AF',
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    backgroundColor: '#151026',
    borderWidth: 1,
    borderColor: '#2D264F',
    borderRadius: 12,
    padding: 16,
    fontSize: 16,
    color: '#FFFFFF',
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    color: '#E5E7EB',
    marginBottom: 8,
    fontWeight: '600',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  chip: {
    flex: 1,
    backgroundColor: '#151026',
    borderWidth: 1,
    borderColor: '#2D264F',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
    marginHorizontal: 4,
  },
  chipActive: {
    borderColor: '#A855F7',
    backgroundColor: '#241246',
  },
  chipText: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  chipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  goalCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#151026',
    borderWidth: 1,
    borderColor: '#2D264F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
  },
  goalCardActive: {
    borderColor: '#EC4899',
    backgroundColor: '#2A0E35',
  },
  goalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  goalDesc: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 2,
    borderColor: '#4B5563',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  checkboxActive: {
    borderColor: '#EC4899',
    backgroundColor: '#EC4899',
  },
  infoBox: {
    backgroundColor: '#121C35',
    borderWidth: 1,
    borderColor: '#1E3A5F',
    borderRadius: 12,
    padding: 16,
    marginTop: 20,
  },
  infoBoxText: {
    color: '#38BDF8',
    fontSize: 14,
    lineHeight: 20,
  },
  footer: {
    flexDirection: 'row',
    paddingVertical: 24,
    backgroundColor: 'transparent',
    alignItems: 'center',
  },
  backButton: {
    padding: 16,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2D264F',
    borderRadius: 12,
    backgroundColor: '#151026',
  },
  backButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  nextButton: {
    flex: 1,
    height: 54,
    borderRadius: 12,
    overflow: 'hidden',
  },
  nextGradient: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  nextButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginRight: 8,
  },
});
