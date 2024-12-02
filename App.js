import React, { useState, useEffect } from 'react';
import { View, Button, Text, Alert, TextInput, StyleSheet } from 'react-native';
import * as MailComposer from 'expo-mail-composer';
import { Audio } from 'expo-av';
import * as FileSystem from 'expo-file-system';
// import { EmailJSResponseStatus } from '@emailjs/browser';

import emailjs from "emailjs-com";

export default function VoiceRecorderApp() {
  const [recording, setRecording] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingUri, setRecordingUri] = useState(null);
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);

  useEffect(() => {
    setupRecording();
    return () => {
      if (recording) {
        recording.unloadAsync();
      }
    };
  }, []);

  const setupEmail = async () => {
    const isAvailable = await MailComposer.isAvailableAsync();
    if (!isAvailable) {
      // Alert.alert('Error', 'Email is not available on this device');
    }
  };

  const validateEmail = (email) => {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
  };


  const sendEmail = async (audioUri) => {
    const base64Audio = await FileSystem.readAsStringAsync(audioUri, {
      encoding: FileSystem.EncodingType.Base64
    });

    const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer d0NeABFjkxXsZ4fyLvQ2P'  // Add private key here
      },
      body: JSON.stringify({
        service_id: 'service_rvvqy6a',
        template_id: 'template_z5wax5a',
        user_id: 'JzMV9A_L0MqfV-EVN',
        accessToken: 'd0NeABFjkxXsZ4fyLvQ2P',
        template_params: {
          to_email: email,
          message: 'Voice recording attached',
          // audio_file: base64Audio
          // filename: 'recording.m4a'
        }
      })
    });

    if (!response.ok) {
      const res = await response.text()
      console.log('res', res)
      throw new Error(res);
    }
  }

// Update stopRecording to use sendEmail
  const stopRecording = async () => {
    try {
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      await sendEmail(uri);
      setIsRecording(false);
    } catch (err) {
      Alert.alert('Error', err, err.message);
     console.log('Error', err, err.message);
    }
  };

  const setupRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        Alert.alert('Permission Required', 'Please allow microphone access to record audio');
        return;
      }

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });
    } catch (err) {
      Alert.alert('Error', 'Failed to setup recording: ' + err.message);
    }
  };

  const startRecording = async () => {
    // if (!email) {
    //   Alert.alert('Error', 'Please enter your email address first');
    //   return;
    // }

    // if (!validateEmail(email)) {
    //   Alert.alert('Error', 'Please enter a valid email address');
    //   return;
    // }
    
    try {
      const newRecording = new Audio.Recording();
      await newRecording.prepareToRecordAsync({
        android: {
          extension: '.m4a',
          outputFormat: Audio.RECORDING_OPTION_ANDROID_OUTPUT_FORMAT_MPEG_4,
          audioEncoder: Audio.RECORDING_OPTION_ANDROID_AUDIO_ENCODER_AAC,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
        },
        ios: {
          extension: '.m4a',
          audioQuality: Audio.RECORDING_OPTION_IOS_AUDIO_QUALITY_HIGH,
          sampleRate: 44100,
          numberOfChannels: 2,
          bitRate: 128000,
          linearPCMBitDepth: 16,
          linearPCMIsBigEndian: false,
          linearPCMIsFloat: false,
        },
      });
      
      await newRecording.startAsync();
      setRecording(newRecording);
      setIsRecording(true);
    } catch (err) {
      Alert.alert('Error', 'Failed to start recording: ' + err.message);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        value={email}
        onChangeText={setEmail}
        placeholder="Enter your email"
        keyboardType="email-address"
        autoCapitalize="none"
        editable={!isRecording}
        autoCompleteType="email"
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
    backgroundColor: '#f5f5f5',
  },
  input: {
    width: '100%',
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 30,
    fontSize: 16,
    backgroundColor: '#fff',
  },
  status: {
    fontSize: 24,
    marginBottom: 30,
    fontWeight: '500',
  },
  sending: {
    marginTop: 20,
    color: '#2196F3',
    fontSize: 16,
  },
});