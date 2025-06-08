import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, Text, View, TextInput, Button, FlatList, TouchableOpacity, Alert, Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export default function App() {
  const [taskText, setTaskText] = useState('');
  const [tasks, setTasks] = useState([]);
  const notificationIds = useRef({});

  useEffect(() => {
    registerForPushNotificationsAsync();

    // Notification response listener
    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      console.log('Notification clicked!', response);
      Alert.alert('Notification clicked', JSON.stringify(response));
    });

    // Set up Android notification channel
    if (Platform.OS === 'android') {
      Notifications.setNotificationChannelAsync('default', {
        name: 'default',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FF231F7C',
      });
    }

    return () => {
      responseListener.remove();
    };
  }, []);

  // Register notification permissions
  async function registerForPushNotificationsAsync() {
    if (Constants.isDevice) {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      if (finalStatus !== 'granted') {
        Alert.alert('Permission required', 'Enable notifications to get task reminders.');
      }
    } else {
      Alert.alert('Notice', 'Must use a physical device for notifications');
    }
  }

  // Schedule a task reminder
  async function scheduleNotification(taskId, taskName) {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Task Reminder',
        body: `Time to complete: ${taskName}`,
        sound: true,
        priority: Notifications.AndroidNotificationPriority.HIGH,
        channelId: 'default',
      },
      trigger: { seconds: 60 }, // Notify after 1 minute
    });
    notificationIds.current[taskId] = id;
    console.log('Scheduled notification with ID:', id);
  }

  // Cancel a scheduled notification
  async function cancelNotification(taskId) {
    const notifId = notificationIds.current[taskId];
    if (notifId) {
      await Notifications.cancelScheduledNotificationAsync(notifId);
      delete notificationIds.current[taskId];
    }
  }

  const addTask = () => {
    if (!taskText.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      text: taskText.trim(),
      completed: false,
    };
    setTasks((prev) => [newTask, ...prev]);
    scheduleNotification(newTask.id, newTask.text);
    setTaskText('');
  };

  const toggleComplete = (id) => {
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id === id) {
          if (!task.completed) cancelNotification(id);
          return { ...task, completed: !task.completed };
        }
        return task;
      })
    );
  };

  const deleteTask = (id) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          cancelNotification(id);
          setTasks((prev) => prev.filter((task) => task.id !== id));
        },
      },
    ]);
  };

  const testNotification = async () => {
    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: '🔔 Test Notification',
        body: 'This is a test message!',
        sound: true,
        channelId: 'default',
      },
      trigger: null, // fire immediately
    });
    console.log('Test notification scheduled with ID:', id);
  };

  const renderItem = ({ item }) => (
    <View style={styles.taskItem}>
      <TouchableOpacity onPress={() => toggleComplete(item.id)} style={{ flex: 1 }}>
        <Text style={[styles.taskText, item.completed && styles.completedTask]}>
          {item.text}
        </Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => deleteTask(item.id)} style={styles.deleteButton}>
        <Text style={{ color: 'white' }}>Delete</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>My Tasks</Text>
      <View style={styles.inputContainer}>
        <TextInput
          placeholder="Enter a task"
          value={taskText}
          onChangeText={setTaskText}
          style={styles.input}
        />
        <Button title="Add" onPress={addTask} />
      </View>
      <FlatList
        data={tasks}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        style={{ width: '100%' }}
        contentContainerStyle={{ paddingBottom: 100 }}
      />
      <Button title="Test Notification" onPress={testNotification} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 50,
    alignItems: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  inputContainer: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    width: '100%',
    marginBottom: 20,
    alignItems: 'center',
  },
  input: {
    flex: 1,
    borderColor: '#aaa',
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginRight: 12,
  },
  taskItem: {
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: '#f2f2f2',
    borderRadius: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  taskText: {
    fontSize: 16,
  },
  completedTask: {
    textDecorationLine: 'line-through',
    color: '#999',
  },
  deleteButton: {
    backgroundColor: '#e74c3c',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 4,
  },
});
