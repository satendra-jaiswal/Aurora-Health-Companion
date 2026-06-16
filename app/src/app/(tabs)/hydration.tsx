import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Plus, Trash2, Droplet, Coffee, Wine } from 'lucide-react-native';
import { API_URL } from '@/constants/api';

export default function HydrationScreen() {
  const [waterIntake, setWaterIntake] = useState(0);
  const [customAmount, setCustomAmount] = useState('');
  const [logs, setLogs] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const waterGoal = 2500; // default ml

  const fetchHydrationData = async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard`);
      const data = await response.json();
      if (data.success) {
        setWaterIntake(data.dashboard.waterIntake);
        setLogs(data.dashboard.nutrition.meals.filter((m: any) => m.meal_type === 'water') || []);
      }
    } catch (e) {
      console.warn('Offline fallback for hydration data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHydrationData();
  }, []);

  const handleLogWater = async (amount: number) => {
    try {
      const response = await fetch(`${`${API_URL}/water`}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ amount }),
      });

      const data = await response.json();
      if (data.success) {
        setWaterIntake(prev => prev + amount);
        // Add local log snippet
        setLogs(prev => [
          { id: data.id, amount, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
          ...prev
        ]);
      }
    } catch (e) {
      // Offline fallback
      setWaterIntake(prev => prev + amount);
      setLogs(prev => [
        { id: Date.now(), amount, timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) },
        ...prev
      ]);
    }
  };

  const handleCustomLog = () => {
    const amount = parseInt(customAmount);
    if (isNaN(amount) || amount <= 0) {
      Alert.alert('Invalid Input', 'Please enter a valid number of milliliters.');
      return;
    }
    handleLogWater(amount);
    setCustomAmount('');
  };

  const percentage = Math.min((waterIntake / waterGoal) * 100, 100);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#06B6D4" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.headerTitle}>Hydration Companion</Text>
      <Text style={styles.headerSubtitle}>Keep your virtual bottle full throughout the day.</Text>

      {/* Main visual section: Virtual Water Bottle */}
      <View style={styles.bottleContainer}>
        <View style={styles.bottleOuter}>
          {/* Bottle neck cap */}
          <View style={styles.bottleCap} />
          {/* Bottle body */}
          <View style={styles.bottleBody}>
            {/* Water level indicator fill */}
            {percentage > 0 && (
              <LinearGradient
                colors={['#22D3EE', '#0891B2']}
                style={[styles.waterFill, { height: `${percentage}%` }]}
              />
            )}
            {/* Overlay percentage text */}
            <View style={styles.overlayTextContainer}>
              <Text style={styles.percentageText}>{Math.round(percentage)}%</Text>
              <Text style={styles.volumeText}>{waterIntake} / {waterGoal} ml</Text>
            </View>
          </View>
        </View>
      </View>

      {/* Quick Add Section */}
      <Text style={styles.sectionTitle}>Quick Add</Text>
      <View style={styles.quickAddRow}>
        <TouchableOpacity style={styles.quickAddCard} onPress={() => handleLogWater(250)}>
          <Coffee color="#06B6D4" size={24} />
          <Text style={styles.quickAddVolume}>+250 ml</Text>
          <Text style={styles.quickAddLabel}>Cup</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAddCard} onPress={() => handleLogWater(500)}>
          <Droplet color="#06B6D4" size={24} />
          <Text style={styles.quickAddVolume}>+500 ml</Text>
          <Text style={styles.quickAddLabel}>Glass</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAddCard} onPress={() => handleLogWater(750)}>
          <Wine color="#06B6D4" size={24} />
          <Text style={styles.quickAddVolume}>+750 ml</Text>
          <Text style={styles.quickAddLabel}>Bottle</Text>
        </TouchableOpacity>
      </View>

      {/* Custom Log Input */}
      <View style={styles.customLogContainer}>
        <TextInput
          style={styles.input}
          placeholder="Enter custom amount (ml)"
          placeholderTextColor="#6B7280"
          keyboardType="numeric"
          value={customAmount}
          onChangeText={setCustomAmount}
        />
        <TouchableOpacity style={styles.customLogBtn} onPress={handleCustomLog}>
          <Plus color="#FFFFFF" size={22} />
        </TouchableOpacity>
      </View>

      {/* Logs History */}
      <Text style={styles.sectionTitle}>Today's Water Logs</Text>
      {logs.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No water logged yet today. Tap a quick add button to start!</Text>
        </View>
      ) : (
        logs.map((log, index) => (
          <View key={log.id || index} style={styles.logRow}>
            <View style={styles.logInfo}>
              <Droplet color="#06B6D4" size={18} style={{ marginRight: 12 }} />
              <Text style={styles.logAmount}>{log.amount} ml</Text>
            </View>
            <Text style={styles.logTime}>{log.timestamp || 'Today'}</Text>
          </View>
        ))
      )}
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
  bottleContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  bottleOuter: {
    alignItems: 'center',
    width: 160,
  },
  bottleCap: {
    width: 50,
    height: 16,
    backgroundColor: '#1E1B38',
    borderColor: '#3B3766',
    borderWidth: 2,
    borderBottomWidth: 0,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
  },
  bottleBody: {
    width: 140,
    height: 260,
    backgroundColor: '#151026',
    borderColor: '#3B3766',
    borderWidth: 3,
    borderRadius: 30,
    overflow: 'hidden',
    justifyContent: 'flex-end',
    position: 'relative',
    shadowColor: '#06B6D4',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.2,
    shadowRadius: 15,
    elevation: 8,
  },
  waterFill: {
    width: '100%',
    position: 'absolute',
    bottom: 0,
    left: 0,
  },
  overlayTextContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  percentageText: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 4,
  },
  volumeText: {
    fontSize: 13,
    color: '#E5E7EB',
    marginTop: 4,
    fontWeight: '500',
    textShadowColor: 'rgba(0, 0, 0, 0.4)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  quickAddRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  quickAddCard: {
    flex: 1,
    backgroundColor: '#151026',
    borderWidth: 1,
    borderColor: '#251F41',
    borderRadius: 16,
    padding: 16,
    marginHorizontal: 4,
    alignItems: 'center',
  },
  quickAddVolume: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    marginTop: 8,
  },
  quickAddLabel: {
    color: '#6B7280',
    fontSize: 11,
    marginTop: 2,
  },
  customLogContainer: {
    flexDirection: 'row',
    marginBottom: 28,
  },
  input: {
    flex: 1,
    backgroundColor: '#151026',
    borderWidth: 1,
    borderColor: '#251F41',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 52,
    fontSize: 15,
    color: '#FFFFFF',
  },
  customLogBtn: {
    width: 52,
    height: 52,
    backgroundColor: '#06B6D4',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
  },
  emptyCard: {
    backgroundColor: '#151026',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#251F41',
  },
  emptyText: {
    color: '#9CA3AF',
    textAlign: 'center',
    lineHeight: 22,
    fontSize: 14,
  },
  logRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#151026',
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#251F41',
  },
  logInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logAmount: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 15,
  },
  logTime: {
    color: '#6B7280',
    fontSize: 12,
  },
});
