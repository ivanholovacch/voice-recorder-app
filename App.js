import React, { useState, useEffect } from 'react';
import { View, Button, Text, Alert } from 'react-native';
import * as MailComposer from 'expo-mail-composer';
import { Audio } from 'expo-av';

export default function VoiceRecorderApp() {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState(null);

  useEffect(() => {
    setupRecording();
    return () => {
      if (recording) {
        recording.unloadAsync();
      }
    };
  }, []);

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
    } catch (err) {
      Alert.alert('Error', 'Failed to stop recording: ' + err.message);
    }
  };

  const sendEmail = async () => {
    if (!recordingUri) {
      Alert.alert('Error', 'No recording to send');
      return;
    }

    try {
      const isAvailable = await MailComposer.isAvailableAsync();
      if (!isAvailable) {
        Alert.alert('Error', 'Email is not available on this device');
        return;
      }

      await MailComposer.composeAsync({
        subject: 'Voice Recording',
        body: 'Please find attached the voice recording.',
        attachments: [recordingUri]
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to send email: ' + err.message);
    }
  };

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', gap: 20 }}>
      <Text style={{ fontSize: 24, marginBottom: 20 }}>
        {isRecording ? 'Recording in progress...' : 'Ready to Record'}
      </Text>
      
      <Button
        title={isRecording ? 'Stop Recording' : 'Start Recording'}
        onPress={isRecording ? stopRecording : startRecording}
        color={isRecording ? 'red' : 'green'}
      />
      
      {recordingUri && !isRecording && (
        <Button
          title="Send Recording via Email"
          onPress={sendEmail}
          color="blue"
        />
      )}
    </View>
  );
}