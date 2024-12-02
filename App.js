import React, { useState, useEffect } from 'react';
import { View, Button, Text, Alert, TextInput, StyleSheet } from 'react-native';
import * as MailComposer from 'expo-mail-composer';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function VoiceRecorderApp() {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState(null);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setupRecording();
    loadSavedEmail();
    return () => {
      if (recording) {
        recording.unloadAsync();
      }
    };
  }, []);

  const loadSavedEmail = async () => {
    try {
      const savedEmail = await AsyncStorage.getItem('userEmail');
      if (savedEmail) setEmail(savedEmail);
    } catch (err) {
      console.error('Failed to load email:', err);
    }
  };

  const saveEmail = async (newEmail) => {
    try {
      await AsyncStorage.setItem('userEmail', newEmail);
      setEmail(newEmail);
    } catch (err) {
      console.error('Failed to save email:', err);
    }
  };

  const setupRecording = async () => {
    try {
      await Audio.requestPermissionsAsync();
      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to setup recording: ' + err.message);
    }
  };

  const startRecording = async () => {
    if (!email) {
      Alert.alert('Error', 'Please enter your email address first');
      return;
    }
    
    try {
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RECORDING_OPTIONS_PRESET_HIGH_QUALITY);
      await recording.startAsync();
      setRecording(recording);
      setIsRecording(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to start recording: ' + err.message);
    }
  };

  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecordingUri(uri);
      setIsRecording(false);
      sendEmail(uri);
    } catch (err) {
      Alert.alert('Error', 'Failed to stop recording: ' + err.message);
    }
  };

  const sendEmail = async (uri) => {
    if (!uri || !email) return;

    setIsSending(true);
    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Email is not available on this device');
        return;
      }

      await MailComposer.composeAsync({
        recipients: [email],
        subject: 'Voice Recording',
        body: 'Please find attached the voice recording.',
        attachments: [uri]
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to send email: ' + err.message);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={saveEmail}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isRecording}
      />
      
      <Text style={styles.status}>
        {isRecording ? 'Recording in progress...' : 'Ready to Record'}
      </Text>
      
      <Button
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
        onPress={isRecording ? stopRecording : startRecording}
        color={isRecording ? 'red' : 'green'}
        disabled={isSending}
      />
      
      {isSending && (
        <Text style={styles.sending}>Sending to {email}...</Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  input: {
    width: '100%',
    height: 40,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  status: {
    fontSize: 24,
    marginBottom: 20,
  },
  sending: {
    marginTop: 10,
    color: 'blue',
  },
});