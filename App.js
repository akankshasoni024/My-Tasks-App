import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TextInput,
  Button,
  FlatList,
  TouchableOpacity,
  Alert,
  Platform,
} from 'react-native';
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import DateTimePicker from '@react-native-community/datetimepicker';
import Modal from 'react-native-modal';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,     // replaces shouldShowAlert
    shouldShowList: true,       // shows in notification center
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});


export default function App() {
  const [taskText, setTaskText] = useState('');
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [description, setDescription] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [reminderTime, setReminderTime] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const notificationIds = useRef({});

  useEffect(() => {
    registerForPushNotificationsAsync();

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      Alert.alert('Notification Clicked', JSON.stringify(response));
    });

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

  const addTask = () => {
    if (!taskText.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      text: taskText.trim(),
      completed: false,
      description: '',
    };
    setTasks((prev) => [newTask, ...prev]);
    setTaskText('');
  };

  const toggleComplete = (id) => {
    setTasks((prev) => {
      const updated = prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      );
      const sorted = updated.sort((a, b) => a.completed - b.completed);
      return sorted;
    });
  };

  const deleteTask = (id) => {
    Alert.alert('Delete Task', 'Are you sure you want to delete this task?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          setTasks((prev) => prev.filter((task) => task.id !== id));
        },
      },
    ]);
  };

  const handleTaskPress = (task) => {
    setSelectedTask(task);
    setDescription(task.description || '');
    setReminderTime(null);
    setShowModal(true);
  };

  const handleSaveDetails = async () => {
    const updatedTasks = tasks.map((t) =>
      t.id === selectedTask.id ? { ...t, description } : t
    );
    setTasks(updatedTasks);

    if (reminderTime) {
      const now = new Date();
      const triggerDate = new Date(now);
      triggerDate.setHours(reminderTime.getHours());
      triggerDate.setMinutes(reminderTime.getMinutes());
      triggerDate.setSeconds(0);
      if (triggerDate < now) triggerDate.setDate(triggerDate.getDate() + 1);

      await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Reminder',
          body: 'Task Description',
          sound: true,
          channelId: 'default',
        },
        trigger: {
          type: 'date',
          date: new Date('2025-06-09T09:46:00+05:30')
        },
      });
      
    }

    setShowModal(false);
  };

  const renderItem = ({ item }) => (
    <TouchableOpacity onPress={() => handleTaskPress(item)} style={styles.taskItem}>
      <TouchableOpacity onPress={() => toggleComplete(item.id)} style={styles.checkbox}>
        <Text style={{ fontSize: 18 }}>{item.completed ? '✔' : '○'}</Text>
      </TouchableOpacity>
      <Text
        style={[styles.taskText, { textDecorationLine: item.completed ? 'line-through' : 'none' }]}
      >
        {item.text}
      </Text>
      <TouchableOpacity onPress={() => deleteTask(item.id)} style={styles.deleteButton}>
        <Text style={{ color: 'white' }}>Delete</Text>
      </TouchableOpacity>
    </TouchableOpacity>
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
      />

      <Modal isVisible={showModal} onBackdropPress={() => setShowModal(false)}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{selectedTask?.text}</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Enter task description..."
            multiline
            value={description}
            onChangeText={setDescription}
          />
          <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.timeButton}>
            <Text style={styles.timeText}>
              {reminderTime
                ? `Reminder: ${reminderTime.getHours()}:${reminderTime.getMinutes()}`
                : 'Set Reminder Time'}
            </Text>
          </TouchableOpacity>
          {showTimePicker && (
            <DateTimePicker
              mode="time"
              value={reminderTime || new Date()}
              onChange={(e, selectedDate) => {
                setShowTimePicker(false);
                if (selectedDate) setReminderTime(selectedDate);
              }}
            />
          )}
          <TouchableOpacity onPress={handleSaveDetails} style={styles.saveButton}>
            <Text style={styles.buttonText}>Save</Text>
          </TouchableOpacity>
        </View>
      </Modal>
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
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: '#f2f2f2',
    borderRadius: 6,
  },
  taskText: {
    fontSize: 16,
    flex: 1,
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
  checkbox: {
    marginRight: 10,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 14,
    padding: 20,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  textArea: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 10,
    padding: 10,
    minHeight: 80,
    marginBottom: 12,
  },
  timeButton: {
    padding: 10,
    backgroundColor: '#EEE',
    borderRadius: 10,
    marginBottom: 12,
  },
  timeText: {
    color: '#333',
  },
  saveButton: {
    backgroundColor: '#6C63FF',
    padding: 12,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
