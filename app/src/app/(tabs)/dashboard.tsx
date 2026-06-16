import React, { useState, useCallback } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useFocusEffect, router } from 'expo-router';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Sparkles,
  Flame,
  Droplet,
  Moon,
  CheckSquare,
  Utensils,
  ChevronRight,
  TrendingUp,
  BrainCircuit
} from 'lucide-react-native';
import { API_URL } from '@/constants/api';

interface DashboardData {
  name: string;
  goals: string[];
  waterIntake: number;
  waterGoal: number;
  sleepDuration: number;
  sleepQuality: number;
  avgSleep: number;
  habits: any[];
  habitProgress: number;
  nutrition: {
    mealsLoggedCount: number;
    summary: {
      calories: number;
      protein: number;
      carbs: number;
      fat: number;
    };
    meals: any[];
  };
  streaks: {
    activeStreak: number;
    longestStreak: number;
  };
  dailyInsight: string;
  memoryNotes: string[];
}

export default function DashboardScreen() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchDashboardData = async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard`);
      const resData = await response.json();
      if (resData.success) {
        setData(resData.dashboard);
      }
    } catch (e) {
      console.warn('Failed to fetch dashboard data:', e);
      // Generate mock fallback data if backend is offline
      setData({
        name: 'Aurora User',
        goals: ['Improve Hydration', 'Sleep Better'],
        waterIntake: 750,
        waterGoal: 2500,
        sleepDuration: 7.2,
        sleepQuality: 4,
        avgSleep: 6.8,
        habits: [
          { id: 1, name: 'Drink Water', completed: true },
          { id: 2, name: 'Morning Stretch', completed: false },
        ],
        habitProgress: 50,
        nutrition: {
          mealsLoggedCount: 1,
          summary: { calories: 350, protein: 15, carbs: 45, fat: 10 },
          meals: []
        },
        streaks: { activeStreak: 3, longestStreak: 7 },
        dailyInsight: 'Looking good! You completed 1 of your habits. Prioritize drinking water this afternoon.',
        memoryNotes: ['Prefers morning workouts', 'Tends to log water late']
      });
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useFocusEffect(
    useCallback(() => {
      fetchDashboardData();
    }, [])
  );

  const onRefresh = () => {
    setRefreshing(true);
    fetchDashboardData();
  };

  if (isLoading || !data) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#A855F7" />
      </View>
    );
  }

  const navigateTo = (tabName: string) => {
    router.push(`/(tabs)/${tabName}`);
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.scrollContent}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor="#A855F7" />
      }
    >
      {/* Header Profile Greeting */}
      <View style={styles.header}>
        <View>
          <Text style={styles.greetingText}>Hello, {data.name}</Text>
          <Text style={styles.dateText}>
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' })}
          </Text>
        </View>
        <TouchableOpacity style={styles.streakIndicator} onPress={() => navigateTo('habits')}>
          <Flame color="#F97316" size={24} fill={data.streaks.activeStreak > 0 ? "#F97316" : "transparent"} />
          <Text style={styles.streakCount}>{data.streaks.activeStreak} Days</Text>
        </TouchableOpacity>
      </View>

      {/* Daily Advice Insight Card */}
      <LinearGradient
        colors={['#7C3AED', '#DB2777']}
        style={styles.insightCard}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.insightHeader}>
          <Sparkles color="#FFFFFF" size={20} />
          <Text style={styles.insightTitle}>Daily AI Companion Insight</Text>
        </View>
        <Text style={styles.insightText}>"{data.dailyInsight}"</Text>
      </LinearGradient>

      {/* Grid Cards Container */}
      <Text style={styles.sectionTitle}>Daily Summary</Text>
      <View style={styles.grid}>
        
        {/* Hydration Card */}
        <TouchableOpacity style={styles.card} onPress={() => navigateTo('hydration')}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(6, 182, 212, 0.15)' }]}>
            <Droplet color="#06B6D4" size={20} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>Hydration</Text>
            <Text style={styles.cardValue}>{data.waterIntake} <Text style={styles.cardUnit}>/ {data.waterGoal} ml</Text></Text>
            {/* Progress bar */}
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { backgroundColor: '#06B6D4', width: `${Math.min((data.waterIntake / data.waterGoal) * 100, 100)}%` }]} />
            </View>
          </View>
          <ChevronRight color="#4B5563" size={20} style={styles.cardChevron} />
        </TouchableOpacity>

        {/* Sleep Card */}
        <TouchableOpacity style={styles.card} onPress={() => navigateTo('sleep')}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(59, 130, 246, 0.15)' }]}>
            <Moon color="#3B82F6" size={20} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>Sleep</Text>
            <Text style={styles.cardValue}>
              {data.sleepDuration > 0 ? `${data.sleepDuration} hrs` : 'No log yet'}
            </Text>
            <Text style={styles.cardSub}>Avg: {data.avgSleep} hrs</Text>
          </View>
          <ChevronRight color="#4B5563" size={20} style={styles.cardChevron} />
        </TouchableOpacity>

        {/* Habits Card */}
        <TouchableOpacity style={styles.card} onPress={() => navigateTo('habits')}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(16, 185, 129, 0.15)' }]}>
            <CheckSquare color="#10B981" size={20} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>Habits</Text>
            <Text style={styles.cardValue}>{data.habitProgress}%</Text>
            <View style={styles.progressBarBg}>
              <View style={[styles.progressBarFill, { backgroundColor: '#10B981', width: `${data.habitProgress}%` }]} />
            </View>
          </View>
          <ChevronRight color="#4B5563" size={20} style={styles.cardChevron} />
        </TouchableOpacity>

        {/* Nutrition Card */}
        <TouchableOpacity style={styles.card} onPress={() => navigateTo('nutrition')}>
          <View style={[styles.iconBox, { backgroundColor: 'rgba(236, 72, 153, 0.15)' }]}>
            <Utensils color="#EC4899" size={20} />
          </View>
          <View style={styles.cardContent}>
            <Text style={styles.cardLabel}>Nutrition</Text>
            <Text style={styles.cardValue}>{data.nutrition.summary.calories} <Text style={styles.cardUnit}>kcal</Text></Text>
            <Text style={styles.cardSub}>
              P: {data.nutrition.summary.protein}g | C: {data.nutrition.summary.carbs}g | F: {data.nutrition.summary.fat}g
            </Text>
          </View>
          <ChevronRight color="#4B5563" size={20} style={styles.cardChevron} />
        </TouchableOpacity>

      </View>

      {/* Memory System Section */}
      {data.memoryNotes.length > 0 && (
        <View style={styles.memorySection}>
          <View style={styles.memoryHeader}>
            <BrainCircuit color="#A855F7" size={22} />
            <Text style={styles.memoryTitle}>Long-term Companion Memory</Text>
          </View>
          <View style={styles.memoryBox}>
            {data.memoryNotes.map((note, index) => (
              <View key={index} style={styles.memoryRow}>
                <TrendingUp color="#8B5CF6" size={16} style={{ marginRight: 8 }} />
                <Text style={styles.memoryText}>{note}</Text>
              </View>
            ))}
          </View>
        </View>
      )}

      {/* Quick Audio Callout */}
      <TouchableOpacity 
        style={styles.micCallout} 
        onPress={() => navigateTo('companion')}
      >
        <LinearGradient
          colors={['#A855F7', '#6366F1']}
          style={styles.micGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <Text style={styles.micCalloutText}>🎙️ Tap to talk to Aurora Health Companion</Text>
        </LinearGradient>
      </TouchableOpacity>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
  },
  greetingText: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  dateText: {
    fontSize: 14,
    color: '#9CA3AF',
    marginTop: 4,
  },
  streakIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1E1430',
    borderWidth: 1,
    borderColor: '#3B2463',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  streakCount: {
    color: '#F97316',
    fontWeight: 'bold',
    marginLeft: 6,
    fontSize: 14,
  },
  insightCard: {
    borderRadius: 18,
    padding: 20,
    marginBottom: 28,
    shadowColor: '#7C3AED',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 15,
    elevation: 8,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  insightTitle: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
    marginLeft: 8,
    letterSpacing: 0.5,
  },
  insightText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
    opacity: 0.95,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  card: {
    width: '48%',
    backgroundColor: '#151026',
    borderWidth: 1,
    borderColor: '#251F41',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    flexDirection: 'row',
    position: 'relative',
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'absolute',
    top: 16,
    left: 16,
  },
  cardContent: {
    marginTop: 44,
    flex: 1,
  },
  cardLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  cardValue: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 4,
  },
  cardUnit: {
    fontSize: 12,
    fontWeight: 'normal',
    color: '#6B7280',
  },
  cardSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 6,
  },
  progressBarBg: {
    height: 4,
    backgroundColor: '#251F41',
    borderRadius: 2,
    marginTop: 10,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    borderRadius: 2,
  },
  cardChevron: {
    position: 'absolute',
    top: 16,
    right: 8,
  },
  memorySection: {
    marginBottom: 28,
  },
  memoryHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  memoryTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginLeft: 8,
  },
  memoryBox: {
    backgroundColor: '#151026',
    borderWidth: 1,
    borderColor: '#251F41',
    borderRadius: 16,
    padding: 16,
  },
  memoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  memoryText: {
    color: '#E5E7EB',
    fontSize: 14,
    flex: 1,
    lineHeight: 20,
  },
  micCallout: {
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  micGradient: {
    paddingVertical: 18,
    paddingHorizontal: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  micCalloutText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
