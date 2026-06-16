import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Moon, Star, Clock, Info } from 'lucide-react-native';
import { API_URL } from '@/constants/api';

const DAYS_OF_WEEK = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

export default function SleepScreen() {
  const [duration, setDuration] = useState(8);
  const [quality, setQuality] = useState(4);
  const [history, setHistory] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [averageSleep, setAverageSleep] = useState(0);

  const fetchSleepData = async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard`);
      const data = await response.json();
      if (data.success) {
        setAverageSleep(data.dashboard.avgSleep || 7.0);
      }

      // Fetch weekly history
      const histResponse = await fetch(`${API_URL}/sleep/history`);
      const histData = await histResponse.json();
      if (histData.success && histData.history.length > 0) {
        setHistory(histData.history);
      } else {
        // Fallback mock history for chart
        setHistory([
          { date: '2026-06-09', duration: 7.5, quality: 4 },
          { date: '2026-06-10', duration: 6.8, quality: 3 },
          { date: '2026-06-11', duration: 8.0, quality: 5 },
          { date: '2026-06-12', duration: 5.5, quality: 2 },
          { date: '2026-06-13', duration: 7.2, quality: 4 },
          { date: '2026-06-14', duration: 8.5, quality: 5 },
          { date: '2026-06-15', duration: 7.0, quality: 4 },
        ]);
      }
    } catch (e) {
      console.warn('Offline fallback for sleep history');
      setHistory([
        { date: 'Mon', duration: 7.5, quality: 4 },
        { date: 'Tue', duration: 6.8, quality: 3 },
        { date: 'Wed', duration: 8.0, quality: 5 },
        { date: 'Thu', duration: 5.5, quality: 2 },
        { date: 'Fri', duration: 7.2, quality: 4 },
        { date: 'Sat', duration: 8.5, quality: 5 },
        { date: 'Sun', duration: 7.0, quality: 4 },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSleepData();
  }, []);

  const handleLogSleep = async () => {
    try {
      const response = await fetch(`${API_URL}/sleep`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ duration, quality }),
      });

      const data = await response.json();
      if (data.success) {
        Alert.alert('Sleep Logged', 'Sleep logged successfully.');
        fetchSleepData();
      }
    } catch (e) {
      // Mock log local update
      Alert.alert('Sleep Logged (Offline)', 'Offline fallback activated.');
      const newHistory = [...history];
      newHistory[newHistory.length - 1] = { date: 'Today', duration, quality };
      setHistory(newHistory);
      setAverageSleep(parseFloat(((averageSleep * 6 + duration) / 7).toFixed(1)));
    }
  };

  const adjustDuration = (amount: number) => {
    const val = duration + amount;
    if (val >= 1 && val <= 20) {
      setDuration(parseFloat(val.toFixed(1)));
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#3B82F6" />
      </View>
    );
  }

  // Find max duration in history to scale bars
  const maxHistoryDuration = Math.max(...history.map(h => h.duration || 8), 10);

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.headerTitle}>Sleep Center</Text>
      <Text style={styles.headerSubtitle}>Monitor duration and improve rest consistency.</Text>

      {/* Bar Chart Section */}
      <View style={styles.chartCard}>
        <Text style={styles.chartTitle}>Sleep Consistency</Text>
        <View style={styles.chartContainer}>
          {history.map((day, idx) => {
            const barHeight = (day.duration / maxHistoryDuration) * 120;
            const dayName = day.date.includes('-') 
              ? DAYS_OF_WEEK[new Date(day.date).getDay() === 0 ? 6 : new Date(day.date).getDay() - 1] 
              : day.date;
            
            return (
              <View key={idx} style={styles.barColumn}>
                <Text style={styles.barValText}>{day.duration}h</Text>
                <View style={styles.barTrack}>
                  <LinearGradient
                    colors={day.duration >= 7 ? ['#3B82F6', '#60A5FA'] : ['#E11D48', '#FB7185']}
                    style={[styles.barFill, { height: barHeight }]}
                    start={{ x: 0, y: 0 }}
                    end={{ x: 0, y: 1 }}
                  />
                </View>
                <Text style={styles.barLabel}>{dayName}</Text>
              </View>
            );
          })}
        </View>
        <View style={styles.averageRow}>
          <Text style={styles.averageLabel}>7-Day Average Sleep</Text>
          <Text style={styles.averageValue}>{averageSleep} Hours</Text>
        </View>
      </View>

      {/* Log Sleep Form */}
      <Text style={styles.sectionTitle}>Log Last Night's Sleep</Text>
      <View style={styles.formCard}>
        {/* Sleep duration adjustment */}
        <Text style={styles.formLabel}>How long did you sleep?</Text>
        <View style={styles.stepperContainer}>
          <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustDuration(-0.5)}>
            <Text style={styles.stepperBtnText}>-0.5</Text>
          </TouchableOpacity>
          <View style={styles.stepperValContainer}>
            <Clock color="#3B82F6" size={24} style={{ marginRight: 8 }} />
            <Text style={styles.stepperVal}>{duration} <Text style={styles.stepperUnit}>hours</Text></Text>
          </View>
          <TouchableOpacity style={styles.stepperBtn} onPress={() => adjustDuration(0.5)}>
            <Text style={styles.stepperBtnText}>+0.5</Text>
          </TouchableOpacity>
        </View>

        {/* Quality stars */}
        <Text style={[styles.formLabel, { marginTop: 20 }]}>Rate sleep quality</Text>
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map(star => (
            <TouchableOpacity key={star} onPress={() => setQuality(star)}>
              <Star
                color={star <= quality ? '#F59E0B' : '#4B5563'}
                fill={star <= quality ? '#F59E0B' : 'transparent'}
                size={32}
                style={{ marginHorizontal: 6 }}
              />
            </TouchableOpacity>
          ))}
        </View>

        {/* Log button */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleLogSleep}>
          <Text style={styles.submitBtnText}>Log Sleep</Text>
        </TouchableOpacity>
      </View>

      {/* Sleep Insights */}
      <Text style={styles.sectionTitle}>Aurora Sleep Insights</Text>
      <View style={styles.insightBox}>
        <Info color="#3B82F6" size={20} style={{ marginRight: 12, marginTop: 2 }} />
        <View style={{ flex: 1 }}>
          <Text style={styles.insightText}>
            💡 Going to bed before 11 PM helps match your biological circadian rhythm, leading to more restorative deep sleep and improved morning energy levels.
          </Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C081A',
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0C081A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
    marginBottom: 28,
  },
  chartCard: {
    backgroundColor: '#151026',
    borderWidth: 1,
    borderColor: '#251F41',
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
  },
  chartTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  chartContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    height: 160,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#251F41',
  },
  barColumn: {
    alignItems: 'center',
    flex: 1,
  },
  barValText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 4,
  },
  barTrack: {
    height: 120,
    width: 14,
    backgroundColor: '#201938',
    borderRadius: 7,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  barFill: {
    width: '100%',
    borderRadius: 7,
  },
  barLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 8,
  },
  averageRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  averageLabel: {
    color: '#9CA3AF',
    fontSize: 14,
  },
  averageValue: {
    color: '#3B82F6',
    fontWeight: 'bold',
    fontSize: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  formCard: {
    backgroundColor: '#151026',
    borderWidth: 1,
    borderColor: '#251F41',
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
  },
  formLabel: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 12,
  },
  stepperContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1738',
    borderRadius: 14,
    padding: 8,
  },
  stepperBtn: {
    backgroundColor: '#29204A',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  stepperBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  stepperValContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stepperVal: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: 'bold',
  },
  stepperUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: '#9CA3AF',
  },
  starsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginVertical: 8,
  },
  submitBtn: {
    backgroundColor: '#3B82F6',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
  },
  insightBox: {
    flexDirection: 'row',
    backgroundColor: '#12234D',
    borderWidth: 1,
    borderColor: '#1E3E7F',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
  },
  insightText: {
    color: '#60A5FA',
    fontSize: 14,
    lineHeight: 20,
  },
});
