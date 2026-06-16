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
import { Check, Plus, Book, Accessibility, Wind, Droplet, Smile, Heart } from 'lucide-react-native';
import { API_URL } from '@/constants/api';

const AVAILABLE_ICONS = [
  { name: 'book', comp: Book },
  { name: 'accessibility', comp: Accessibility },
  { name: 'wind', comp: Wind },
  { name: 'droplet', comp: Droplet },
  { name: 'smile', comp: Smile },
  { name: 'heart', comp: Heart },
];

export default function HabitsScreen() {
  const [habits, setHabits] = useState<any[]>([]);
  const [newHabitName, setNewHabitName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('smile');
  const [isLoading, setIsLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchHabits = async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard`);
      const data = await response.json();
      if (data.success) {
        setHabits(data.dashboard.habits || []);
      }
    } catch (e) {
      console.warn('Offline fallback for habits');
      setHabits([
        { id: 1, name: 'Drink Water', icon: 'droplet', completed: true },
        { id: 2, name: 'Morning Stretch', icon: 'accessibility', completed: false },
        { id: 3, name: 'Read a Book', icon: 'book', completed: false },
        { id: 4, name: 'Meditation', icon: 'wind', completed: true },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHabits();
  }, []);

  const handleToggleHabit = async (habitId: number) => {
    // Optimistic UI update
    setHabits(prev =>
      prev.map(h => (h.id === habitId ? { ...h, completed: !h.completed } : h))
    );

    try {
      const response = await fetch(`${API_URL}/habit/toggle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ habitId }),
      });
      const data = await response.json();
      if (!data.success) {
        // Revert on failure
        fetchHabits();
      }
    } catch (e) {
      console.warn('Network issue toggling habit, keeping optimistic state:', e);
    }
  };

  const handleCreateHabit = async () => {
    if (!newHabitName.trim()) {
      Alert.alert('Required', 'Please enter a habit name.');
      return;
    }

    try {
      const response = await fetch(`${API_URL}/habit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newHabitName, icon: selectedIcon }),
      });
      const data = await response.json();
      if (data.success) {
        setNewHabitName('');
        setShowAddForm(false);
        fetchHabits();
      }
    } catch (e) {
      // Mock local addition
      const mockNew = {
        id: Date.now(),
        name: newHabitName,
        icon: selectedIcon,
        completed: false,
      };
      setHabits(prev => [...prev, mockNew]);
      setNewHabitName('');
      setShowAddForm(false);
    }
  };

  const renderIcon = (iconName: string, color: string, size: number) => {
    const iconObj = AVAILABLE_ICONS.find(i => i.name === iconName) || AVAILABLE_ICONS[4];
    const IconComp = iconObj.comp;
    return <IconComp color={color} size={size} />;
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#10B981" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <View style={styles.header}>
        <View>
          <Text style={styles.headerTitle}>Habits Center</Text>
          <Text style={styles.headerSubtitle}>Build daily routines through consistency.</Text>
        </View>
        <TouchableOpacity
          style={styles.addHabitBtnHeader}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Plus color="#FFFFFF" size={20} />
        </TouchableOpacity>
      </View>

      {/* Add New Habit Form */}
      {showAddForm && (
        <View style={styles.addFormCard}>
          <Text style={styles.formTitle}>Track New Habit</Text>
          
          <TextInput
            style={styles.input}
            placeholder="e.g. Journaling, Core Workouts"
            placeholderTextColor="#6B7280"
            value={newHabitName}
            onChangeText={setNewHabitName}
          />

          <Text style={styles.label}>Select Habit Icon</Text>
          <View style={styles.iconsRow}>
            {AVAILABLE_ICONS.map(item => (
              <TouchableOpacity
                key={item.name}
                style={[
                  styles.iconBoxSelect,
                  selectedIcon === item.name && styles.iconBoxSelectActive,
                ]}
                onPress={() => setSelectedIcon(item.name)}
              >
                <item.comp color={selectedIcon === item.name ? '#10B981' : '#9CA3AF'} size={24} />
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.formActions}>
            <TouchableOpacity
              style={styles.cancelBtn}
              onPress={() => setShowAddForm(false)}
            >
              <Text style={styles.cancelBtnText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.submitBtn} onPress={handleCreateHabit}>
              <Text style={styles.submitBtnText}>Create Habit</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Habits List */}
      <View style={styles.habitsList}>
        {habits.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.emptyText}>No habits active. Start by adding a custom habit above!</Text>
          </View>
        ) : (
          habits.map(habit => (
            <TouchableOpacity
              key={habit.id}
              style={[styles.habitRow, habit.completed && styles.habitRowCompleted]}
              onPress={() => handleToggleHabit(habit.id)}
              activeOpacity={0.8}
            >
              <View style={styles.habitLeft}>
                <View
                  style={[
                    styles.habitIconBox,
                    {
                      backgroundColor: habit.completed
                        ? 'rgba(16, 185, 129, 0.15)'
                        : 'rgba(32, 25, 56, 0.8)',
                    },
                  ]}
                >
                  {renderIcon(
                    habit.icon,
                    habit.completed ? '#10B981' : '#9CA3AF',
                    20
                  )}
                </View>
                <Text
                  style={[
                    styles.habitName,
                    habit.completed && styles.habitNameCompleted,
                  ]}
                >
                  {habit.name}
                </Text>
              </View>

              <View
                style={[
                  styles.checkbox,
                  habit.completed && styles.checkboxCompleted,
                ]}
              >
                {habit.completed && <Check color="#FFFFFF" size={14} />}
              </View>
            </TouchableOpacity>
          ))
        )}
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 24,
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
  },
  addHabitBtnHeader: {
    width: 44,
    height: 44,
    borderRadius: 12,
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addFormCard: {
    backgroundColor: '#151026',
    borderWidth: 1,
    borderColor: '#251F41',
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
  },
  formTitle: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  input: {
    backgroundColor: '#1F1A3A',
    borderWidth: 1,
    borderColor: '#2D264F',
    borderRadius: 12,
    padding: 14,
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 16,
  },
  label: {
    fontSize: 13,
    color: '#9CA3AF',
    marginBottom: 10,
    fontWeight: '500',
  },
  iconsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  iconBoxSelect: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: '#1F1A3A',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#2D264F',
  },
  iconBoxSelectActive: {
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
  },
  formActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelBtn: {
    flex: 1,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#2D264F',
    borderRadius: 12,
    marginRight: 8,
  },
  cancelBtnText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  submitBtn: {
    flex: 1.5,
    backgroundColor: '#10B981',
    padding: 14,
    alignItems: 'center',
    borderRadius: 12,
    marginLeft: 8,
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
  },
  habitsList: {
    marginTop: 8,
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
  habitRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#151026',
    borderRadius: 18,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#251F41',
  },
  habitRowCompleted: {
    borderColor: 'rgba(16, 185, 129, 0.3)',
    backgroundColor: '#112224',
  },
  habitLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  habitIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  habitName: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  habitNameCompleted: {
    color: '#9CA3AF',
    textDecorationLine: 'line-through',
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 7,
    borderWidth: 2,
    borderColor: '#4B5563',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxCompleted: {
    borderColor: '#10B981',
    backgroundColor: '#10B981',
  },
});
