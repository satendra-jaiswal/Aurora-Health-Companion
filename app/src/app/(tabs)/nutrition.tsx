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
import { Sparkles, Plus, Trash2, Utensils } from 'lucide-react-native';
import { API_URL } from '@/constants/api';

export default function NutritionScreen() {
  const [description, setDescription] = useState('');
  const [mealType, setMealType] = useState('breakfast');
  const [meals, setMeals] = useState<any[]>([]);
  const [calories, setCalories] = useState(0);
  const [protein, setProtein] = useState(0);
  const [carbs, setCarbs] = useState(0);
  const [fat, setFat] = useState(0);
  const [isEstimating, setIsEstimating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Manual inputs if they want to override
  const [manualCal, setManualCal] = useState('');
  const [manualProt, setManualProt] = useState('');
  const [manualCarb, setManualCarb] = useState('');
  const [manualFat, setManualFat] = useState('');
  const [showManual, setShowManual] = useState(false);

  const fetchNutritionData = async () => {
    try {
      const response = await fetch(`${API_URL}/dashboard`);
      const data = await response.json();
      if (data.success) {
        setMeals(data.dashboard.nutrition.meals || []);
        setCalories(data.dashboard.nutrition.summary.calories || 0);
        setProtein(data.dashboard.nutrition.summary.protein || 0);
        setCarbs(data.dashboard.nutrition.summary.carbs || 0);
        setFat(data.dashboard.nutrition.summary.fat || 0);
      }
    } catch (e) {
      console.warn('Offline fallback for nutrition');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchNutritionData();
  }, []);

  const handleAddMeal = async () => {
    if (!description.trim() && !manualCal) {
      Alert.alert('Required', 'Please enter a meal description or manual calorie amount.');
      return;
    }

    setIsEstimating(true);

    const payload = {
      meal_type: mealType,
      description: description || `${mealType.toUpperCase()} Log`,
      calories: manualCal ? parseInt(manualCal) : 0,
      protein: manualProt ? parseFloat(manualProt) : 0,
      carbs: manualCarb ? parseFloat(manualCarb) : 0,
      fat: manualFat ? parseFloat(manualFat) : 0,
    };

    try {
      const response = await fetch(`${API_URL}/meals`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      if (data.success) {
        setDescription('');
        setManualCal('');
        setManualProt('');
        setManualCarb('');
        setManualFat('');
        setShowManual(false);
        fetchNutritionData();
      }
    } catch (e) {
      console.warn('Network issue logging meal, creating mock log:', e);
      // Offline fallback estimate
      const mockMeal = {
        id: Date.now(),
        meal_type: mealType,
        description: description || 'Logged Meal',
        calories: manualCal ? parseInt(manualCal) : 320,
        protein: manualProt ? parseFloat(manualProt) : 12,
        carbs: manualCarb ? parseFloat(manualCarb) : 40,
        fat: manualFat ? parseFloat(manualFat) : 8,
      };
      setMeals(prev => [mockMeal, ...prev]);
      setCalories(prev => prev + mockMeal.calories);
      setProtein(prev => prev + mockMeal.protein);
      setCarbs(prev => prev + mockMeal.carbs);
      setFat(prev => prev + mockMeal.fat);
      setDescription('');
      setManualCal('');
      setManualProt('');
      setManualCarb('');
      setManualFat('');
      setShowManual(false);
    } finally {
      setIsEstimating(false);
    }
  };

  const handleDeleteMeal = async (mealId: number) => {
    try {
      const response = await fetch(`${API_URL}/meals/${mealId}`, {
        method: 'DELETE',
      });
      const data = await response.json();
      if (data.success) {
        fetchNutritionData();
      }
    } catch (e) {
      // Offline fallback delete
      const deleted = meals.find(m => m.id === mealId);
      if (deleted) {
        setCalories(prev => Math.max(0, prev - deleted.calories));
        setProtein(prev => Math.max(0, prev - deleted.protein));
        setCarbs(prev => Math.max(0, prev - deleted.carbs));
        setFat(prev => Math.max(0, prev - deleted.fat));
        setMeals(prev => prev.filter(m => m.id !== mealId));
      }
    }
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#EC4899" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
      <Text style={styles.headerTitle}>Nutrition Awareness</Text>
      <Text style={styles.headerSubtitle}>Describe your meal and let AI calculate the nutritional value.</Text>

      {/* Progress Cards */}
      <View style={styles.macroCard}>
        <View style={styles.calContainer}>
          <Text style={styles.calValue}>{calories}</Text>
          <Text style={styles.calLabel}>Total kcal</Text>
        </View>
        <View style={styles.divider} />
        <View style={styles.macroRow}>
          <View style={styles.macroCol}>
            <Text style={[styles.macroVal, { color: '#F43F5E' }]}>{protein}g</Text>
            <Text style={styles.macroLabel}>Protein</Text>
          </View>
          <View style={styles.macroCol}>
            <Text style={[styles.macroVal, { color: '#3B82F6' }]}>{carbs}g</Text>
            <Text style={styles.macroLabel}>Carbs</Text>
          </View>
          <View style={styles.macroCol}>
            <Text style={[styles.macroVal, { color: '#EAB308' }]}>{fat}g</Text>
            <Text style={styles.macroLabel}>Fat</Text>
          </View>
        </View>
      </View>

      {/* Add meal section */}
      <Text style={styles.sectionTitle}>Add a Meal</Text>
      <View style={styles.formCard}>
        {/* Meal Type selection */}
        <View style={styles.mealTypeRow}>
          {['breakfast', 'lunch', 'dinner', 'snack'].map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.mealTypeChip, mealType === type && styles.mealTypeChipActive]}
              onPress={() => setMealType(type)}
            >
              <Text style={[styles.mealTypeChipText, mealType === type && styles.mealTypeChipTextActive]}>
                {type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* AI Input */}
        <Text style={styles.formLabel}>What did you eat?</Text>
        <TextInput
          style={[styles.input, { height: 80 }]}
          placeholder="e.g. Scrambled eggs with dynamic greens and a cup of black coffee."
          placeholderTextColor="#6B7280"
          multiline
          numberOfLines={3}
          value={description}
          onChangeText={setDescription}
        />

        {/* Toggle Manual Override */}
        <TouchableOpacity style={styles.toggleManualRow} onPress={() => setShowManual(!showManual)}>
          <Text style={styles.toggleManualText}>
            {showManual ? 'Hide manual macros' : 'Enter macros manually (optional)'}
          </Text>
        </TouchableOpacity>

        {showManual && (
          <View style={styles.manualGrid}>
            <View style={styles.manualCol}>
              <Text style={styles.manualLabel}>Calories (kcal)</Text>
              <TextInput style={styles.manualInput} keyboardType="numeric" value={manualCal} onChangeText={setManualCal} placeholder="0" placeholderTextColor="#6B7280" />
            </View>
            <View style={styles.manualCol}>
              <Text style={styles.manualLabel}>Protein (g)</Text>
              <TextInput style={styles.manualInput} keyboardType="numeric" value={manualProt} onChangeText={setManualProt} placeholder="0" placeholderTextColor="#6B7280" />
            </View>
            <View style={styles.manualCol}>
              <Text style={styles.manualLabel}>Carbs (g)</Text>
              <TextInput style={styles.manualInput} keyboardType="numeric" value={manualCarb} onChangeText={setManualCarb} placeholder="0" placeholderTextColor="#6B7280" />
            </View>
            <View style={styles.manualCol}>
              <Text style={styles.manualLabel}>Fat (g)</Text>
              <TextInput style={styles.manualInput} keyboardType="numeric" value={manualFat} onChangeText={setManualFat} placeholder="0" placeholderTextColor="#6B7280" />
            </View>
          </View>
        )}

        {/* Log button */}
        <TouchableOpacity style={styles.submitBtn} onPress={handleAddMeal} disabled={isEstimating}>
          {isEstimating ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <View style={styles.btnRow}>
              <Sparkles color="#FFFFFF" size={18} style={{ marginRight: 8 }} />
              <Text style={styles.submitBtnText}>Estimate & Log Meal</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Today's Meals list */}
      <Text style={styles.sectionTitle}>Today's Meals</Text>
      {meals.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>No meals logged today. Describe what you ate above!</Text>
        </View>
      ) : (
        meals.map(meal => (
          <View key={meal.id} style={styles.mealRow}>
            <View style={{ flex: 1 }}>
              <View style={styles.mealRowHeader}>
                <Text style={styles.mealTag}>{meal.meal_type.toUpperCase()}</Text>
                <Text style={styles.mealTime}>Today</Text>
              </View>
              <Text style={styles.mealDesc}>{meal.description}</Text>
              <Text style={styles.mealMacros}>
                {meal.calories} kcal | P: {Math.round(meal.protein)}g | C: {Math.round(meal.carbs)}g | F: {Math.round(meal.fat)}g
              </Text>
            </View>
            <TouchableOpacity style={styles.deleteBtn} onPress={() => handleDeleteMeal(meal.id)}>
              <Trash2 color="#EF4444" size={18} />
            </TouchableOpacity>
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
  macroCard: {
    backgroundColor: '#151026',
    borderWidth: 1,
    borderColor: '#251F41',
    borderRadius: 20,
    padding: 20,
    marginBottom: 28,
    flexDirection: 'row',
    alignItems: 'center',
  },
  calContainer: {
    flex: 1,
    alignItems: 'center',
  },
  calValue: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  calLabel: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 4,
  },
  divider: {
    width: 1,
    height: 60,
    backgroundColor: '#251F41',
    marginHorizontal: 12,
  },
  macroRow: {
    flex: 2,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  macroCol: {
    alignItems: 'center',
    flex: 1,
  },
  macroVal: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  macroLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    marginTop: 4,
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
  mealTypeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 20,
  },
  mealTypeChip: {
    flex: 1,
    backgroundColor: '#1E1738',
    borderWidth: 1,
    borderColor: '#2D264F',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
    marginHorizontal: 3,
  },
  mealTypeChipActive: {
    borderColor: '#EC4899',
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
  },
  mealTypeChipText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontWeight: '500',
  },
  mealTypeChipTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  formLabel: {
    color: '#E5E7EB',
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  input: {
    backgroundColor: '#1E1738',
    borderWidth: 1,
    borderColor: '#2D264F',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 16,
    textAlignVertical: 'top',
  },
  toggleManualRow: {
    paddingVertical: 8,
    marginBottom: 16,
  },
  toggleManualText: {
    color: '#EC4899',
    fontSize: 13,
    fontWeight: '600',
  },
  manualGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  manualCol: {
    width: '48%',
    marginBottom: 12,
  },
  manualLabel: {
    color: '#9CA3AF',
    fontSize: 11,
    marginBottom: 6,
  },
  manualInput: {
    backgroundColor: '#1E1738',
    borderWidth: 1,
    borderColor: '#2D264F',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    color: '#FFFFFF',
  },
  submitBtn: {
    backgroundColor: '#EC4899',
    borderRadius: 14,
    padding: 16,
    alignItems: 'center',
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  submitBtnText: {
    color: '#FFFFFF',
    fontWeight: 'bold',
    fontSize: 16,
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
  mealRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#151026',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#251F41',
  },
  mealRowHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
  },
  mealTag: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#EC4899',
    backgroundColor: 'rgba(236, 72, 153, 0.15)',
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: 4,
    marginRight: 10,
  },
  mealTime: {
    color: '#6B7280',
    fontSize: 11,
  },
  mealDesc: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: 'bold',
    lineHeight: 20,
  },
  mealMacros: {
    color: '#9CA3AF',
    fontSize: 12,
    marginTop: 6,
  },
  deleteBtn: {
    padding: 8,
  },
});
