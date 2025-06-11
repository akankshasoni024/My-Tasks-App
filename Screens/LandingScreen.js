import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import LottieView from 'lottie-react-native';

const WelcomeScreen = ({ navigation }) => {
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkFirstTime = async () => {
      const hasLaunched = await AsyncStorage.getItem('hasLaunched');
      if (hasLaunched) {
        navigation.replace('Home'); // Skip if already seen
      } else {
        setLoading(false); // Show welcome screen
      }
    };
    checkFirstTime();
  }, []);

  const handleStart = async () => {
    await AsyncStorage.setItem('hasLaunched', 'true');
    navigation.replace('Home');
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <LottieView
        source={require('../assets/task-animation.json')} // Replace with your Lottie animation
        autoPlay
        loop
        style={{ width: 300, height: 300 }}
      />
      <Text style={styles.title}>Welcome to</Text>
      <Text style={styles.appName}>My Tasks</Text>
      <Text style={styles.subtitle}>Your smart solution to manage tasks efficiently</Text>
      <TouchableOpacity style={styles.button} onPress={handleStart}>
        <Text style={styles.buttonText}>Let's Get Started</Text>
      </TouchableOpacity>
    </View>
  );
};

export default WelcomeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#3EDDFF',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  centered: {
    flex: 1,
    backgroundColor: '#3EDDFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    color: '#fff',
    marginTop: 20,
    fontWeight: '500',
  },
  appName: {
    fontSize: 38,
    color: '#fff',
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 16,
    color: '#fff',
    textAlign: 'center',
    marginVertical: 20,
    maxWidth: 280,
  },
  button: {
    backgroundColor: '#222',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 10,
    marginTop: 10,
  },
  buttonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
