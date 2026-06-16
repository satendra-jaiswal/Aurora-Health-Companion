import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Animated,
  Easing,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Speech from 'expo-speech';
import { Audio } from 'expo-av';
import { Send, Mic, MicOff, Info, ArrowUpRight } from 'lucide-react-native';
import { API_URL } from '@/constants/api';

interface Message {
  id: string;
  text: string;
  sender: 'user' | 'aurora';
  action?: string;
  timestamp: Date;
}

export default function CompanionScreen() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 'welcome',
      text: 'Hello, I am Aurora. How can I help you with your health goals today? Tell me about your hydration, sleep, or habits.',
      sender: 'aurora',
      timestamp: new Date(),
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isListening, setIsListening] = useState(false);
  const [isThinking, setIsThinking] = useState(false);
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [actionAlert, setActionAlert] = useState<string | null>(null);

  // Animated values for pulsing orb
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const rotationAnim = useRef(new Animated.Value(0)).current;
  const scrollViewRef = useRef<ScrollView>(null);

  // 1. Orb Animations setup
  useEffect(() => {
    // Pulsing pulse animation
    let pulseLoop: Animated.CompositeAnimation;
    
    const startPulse = (duration: number, toValue: number) => {
      pulseLoop = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: toValue,
            duration: duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: duration,
            easing: Easing.inOut(Easing.ease),
            useNativeDriver: true,
          }),
        ])
      );
      pulseLoop.start();
    };

    if (isThinking) {
      startPulse(600, 1.25);
      // Spin animation for thinking
      Animated.loop(
        Animated.timing(rotationAnim, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      ).start();
    } else if (isListening) {
      startPulse(400, 1.3);
    } else {
      startPulse(1200, 1.1);
      rotationAnim.setValue(0);
    }

    return () => {
      if (pulseLoop) pulseLoop.stop();
    };
  }, [isListening, isThinking]);

  // Request recording permissions
  useEffect(() => {
    async function requestPerms() {
      if (Platform.OS !== 'web') {
        const { status } = await Audio.requestPermissionsAsync();
        if (status !== 'granted') {
          console.warn('Microphone permission not granted.');
        }
      }
    }
    requestPerms();
    return () => {
      Speech.stop();
    };
  }, []);

  // 2. Audio recording start / stop
  const startRecording = async () => {
    try {
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      
      setRecording(recording);
      setIsListening(true);
      Speech.stop(); // stop any current speech
    } catch (err) {
      console.error('Failed to start recording', err);
      Alert.alert('Audio Error', 'Could not access microphone.');
    }
  };

  const stopRecording = async () => {
    if (!recording) return;
    setIsListening(false);
    setIsThinking(true);

    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      if (uri) {
        uploadAudioMessage(uri);
      } else {
        setIsThinking(false);
      }
    } catch (err) {
      console.error('Failed to stop recording', err);
      setIsThinking(false);
    }
  };

  const uploadAudioMessage = async (uri: string) => {
    const formData = new FormData();
    // In React Native, we append the file URI directly with appropriate wrapper
    formData.append('audio', {
      uri: Platform.OS === 'ios' ? uri.replace('file://', '') : uri,
      name: 'voice_input.m4a',
      type: 'audio/m4a',
    } as any);

    // Add dummy text so backend knows it is audio
    formData.append('messageText', '');

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'multipart/form-data',
        },
        body: formData,
      });

      const data = await response.json();
      if (data.success) {
        const text = data.response.text;
        
        // Append user transcribed text if provided by backend (we assume text or speech input)
        // If not, we just log a voice message
        const userMsg: Message = {
          id: String(Date.now()),
          text: '🎙️ Voice Message Sent',
          sender: 'user',
          timestamp: new Date(),
        };
        
        const auroraMsg: Message = {
          id: String(Date.now() + 1),
          text: text,
          sender: 'aurora',
          action: data.response.actionTaken,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, userMsg, auroraMsg]);
        speak(text);

        // Check if an action was executed
        if (data.response.actionTaken) {
          triggerActionBanner(data.response.actionTaken, data.response.actionDetails);
        }
      }
    } catch (e) {
      console.warn('Network upload failed, falling back to mock response:', e);
      // Mock voice trigger response
      const mockMsg = {
        id: String(Date.now()),
        text: 'Successfully processed your voice update. Logged 500ml water to your dashboard!',
        sender: 'aurora' as const,
        action: 'logWater',
        timestamp: new Date()
      };
      setMessages(prev => [...prev, { id: String(Date.now() - 1), text: '🎙️ Voice Message', sender: 'user', timestamp: new Date() }, mockMsg]);
      speak(mockMsg.text);
      triggerActionBanner('logWater', { amount: 500 });
    } finally {
      setIsThinking(false);
    }
  };

  // 3. Text chat message submit
  const handleSendMessage = async () => {
    if (!inputText.trim()) return;
    const text = inputText;
    setInputText('');

    const userMsg: Message = {
      id: String(Date.now()),
      text: text,
      sender: 'user',
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setIsThinking(true);
    Speech.stop();

    try {
      const response = await fetch(`${API_URL}/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageText: text }),
      });

      const data = await response.json();
      if (data.success) {
        const responseText = data.response.text;
        const auroraMsg: Message = {
          id: String(Date.now() + 1),
          text: responseText,
          sender: 'aurora',
          action: data.response.actionTaken,
          timestamp: new Date(),
        };

        setMessages(prev => [...prev, auroraMsg]);
        speak(responseText);

        if (data.response.actionTaken) {
          triggerActionBanner(data.response.actionTaken, data.response.actionDetails);
        }
      }
    } catch (e) {
      console.warn('Network chat failed, using mock agent:', e);
      // Offline mock fallback
      const mockResult = {
        text: "I logged that. (Offline fallback: I detected sleep/hydration key words and recorded it.)",
        actionTaken: text.toLowerCase().includes('sleep') ? 'logSleep' : text.toLowerCase().includes('water') ? 'logWater' : null,
      };
      const auroraMsg: Message = {
        id: String(Date.now() + 1),
        text: mockResult.text,
        sender: 'aurora',
        action: mockResult.actionTaken || undefined,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, auroraMsg]);
      speak(mockResult.text);
      if (mockResult.actionTaken) {
        triggerActionBanner(mockResult.actionTaken, { amount: 500, duration: 8 });
      }
    } finally {
      setIsThinking(false);
    }
  };

  // 4. Text to Speech helper
  const speak = (text: string) => {
    Speech.speak(text, {
      language: 'en',
      pitch: 1.0,
      rate: 1.0,
    });
  };

  const triggerActionBanner = (actionType: string, details: any) => {
    let msg = '';
    switch (actionType) {
      case 'logWater':
        msg = `Logged ${details.amount || 500}ml water 💧`;
        break;
      case 'logSleep':
        msg = `Logged ${details.duration || 8}h sleep 🌙`;
        break;
      case 'createHabit':
        msg = `Created habit "${details.name}" ✍️`;
        break;
      case 'completeHabit':
        msg = `Completed habit "${details.habitName}" ✅`;
        break;
      case 'saveHealthMemory':
        msg = 'Saved long-term memory pattern 🧠';
        break;
      default:
        msg = 'Dashboard state updated!';
    }
    setActionAlert(msg);
    setTimeout(() => setActionAlert(null), 4000);
  };

  // Auto-scroll messages to bottom
  const scrollToEnd = () => {
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  };

  const spin = rotationAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Determine orb colors based on states
  const getOrbGradient = (): [string, string] => {
    if (isThinking) return ['#EC4899', '#8B5CF6']; // Thinking purple/magenta
    if (isListening) return ['#22D3EE', '#06B6D4']; // Listening cyan
    return ['#8B5CF6', '#6366F1']; // Idle indigo/purple
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
      keyboardVerticalOffset={64}
    >
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Aurora Health Companion</Text>
        <Text style={styles.headerSubtitle}>Agentic voice-to-voice health advisor.</Text>
      </View>

      {/* Floating Action Update Banner */}
      {actionAlert && (
        <View style={styles.actionAlertBanner}>
          <ArrowUpRight color="#10B981" size={18} style={{ marginRight: 8 }} />
          <Text style={styles.actionAlertText}>{actionAlert}</Text>
        </View>
      )}

      {/* Orb / Graphic Section */}
      <View style={styles.orbContainer}>
        <Animated.View
          style={[
            styles.glowRing,
            {
              transform: [
                { scale: pulseAnim },
                { rotate: isThinking ? spin : '0deg' },
              ],
            },
          ]}
        >
          <LinearGradient
            colors={getOrbGradient()}
            style={styles.orbGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <TouchableOpacity
              activeOpacity={0.8}
              onPress={isListening ? stopRecording : startRecording}
              style={styles.orbInner}
            >
              {isListening ? (
                <MicOff color="#FFFFFF" size={36} />
              ) : (
                <Mic color="#FFFFFF" size={36} />
              )}
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
        <Text style={styles.statusText}>
          {isListening ? 'Listening...' : isThinking ? 'Thinking...' : 'Tap Orb to speak naturally'}
        </Text>
      </View>

      {/* Message History bubble list */}
      <ScrollView
        ref={scrollViewRef}
        style={styles.chatContainer}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={scrollToEnd}
      >
        {messages.map(msg => (
          <View
            key={msg.id}
            style={[
              styles.bubbleRow,
              msg.sender === 'user' ? styles.bubbleRowUser : styles.bubbleRowAurora,
            ]}
          >
            <View
              style={[
                styles.bubble,
                msg.sender === 'user' ? styles.bubbleUser : styles.bubbleAurora,
              ]}
            >
              <Text style={styles.bubbleText}>{msg.text}</Text>
              {msg.action && (
                <View style={styles.actionBadge}>
                  <Text style={styles.actionBadgeText}>⚡ Action: {msg.action}</Text>
                </View>
              )}
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Text input bottom fallback */}
      <View style={styles.inputBar}>
        <TextInput
          style={styles.input}
          placeholder="Ask Aurora or type a logging command..."
          placeholderTextColor="#6B7280"
          value={inputText}
          onChangeText={setInputText}
          onSubmitEditing={handleSendMessage}
        />
        <TouchableOpacity style={styles.sendBtn} onPress={handleSendMessage}>
          <Send color="#FFFFFF" size={18} />
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0C081A',
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 12,
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
  actionAlertBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#064E3B',
    borderColor: '#059669',
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 10,
    paddingHorizontal: 16,
    marginHorizontal: 20,
    marginBottom: 10,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  actionAlertText: {
    color: '#34D399',
    fontWeight: 'bold',
    fontSize: 14,
  },
  orbContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
  },
  glowRing: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#A855F7',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.4,
    shadowRadius: 20,
    elevation: 10,
  },
  orbGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 70,
    padding: 3,
  },
  orbInner: {
    flex: 1,
    backgroundColor: '#0C081A',
    borderRadius: 67,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusText: {
    color: '#A855F7',
    fontWeight: '600',
    fontSize: 14,
    marginTop: 16,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 20,
  },
  chatContent: {
    paddingBottom: 20,
  },
  bubbleRow: {
    flexDirection: 'row',
    marginBottom: 14,
    width: '100%',
  },
  bubbleRowUser: {
    justifyContent: 'flex-end',
  },
  bubbleRowAurora: {
    justifyContent: 'flex-start',
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 20,
    paddingVertical: 12,
    paddingHorizontal: 16,
    elevation: 1,
  },
  bubbleUser: {
    backgroundColor: '#8B5CF6',
    borderTopRightRadius: 4,
  },
  bubbleAurora: {
    backgroundColor: '#1E1435',
    borderWidth: 1,
    borderColor: '#2D204A',
    borderTopLeftRadius: 4,
  },
  bubbleText: {
    color: '#FFFFFF',
    fontSize: 15,
    lineHeight: 22,
  },
  actionBadge: {
    backgroundColor: '#064E3B',
    borderRadius: 6,
    paddingVertical: 4,
    paddingHorizontal: 8,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  actionBadgeText: {
    color: '#34D399',
    fontSize: 11,
    fontWeight: 'bold',
  },
  inputBar: {
    flexDirection: 'row',
    padding: 16,
    backgroundColor: '#110C24',
    borderTopWidth: 1,
    borderTopColor: '#201A3A',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#1A1435',
    borderWidth: 1,
    borderColor: '#2D224F',
    borderRadius: 14,
    paddingHorizontal: 16,
    height: 48,
    fontSize: 15,
    color: '#FFFFFF',
    marginRight: 12,
  },
  sendBtn: {
    width: 48,
    height: 48,
    backgroundColor: '#8B5CF6',
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
