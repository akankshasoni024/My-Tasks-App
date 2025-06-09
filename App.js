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
    shouldShowBanner: true,
    shouldShowList: true,
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
  const [notificationTask, setNotificationTask] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);

  const notificationIds = useRef({});

  useEffect(() => {
    registerForPushNotificationsAsync();

    const responseListener = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      const foundTask = tasks.find(task => task.id === data.taskId);
      if (foundTask) {
        setNotificationTask({
          name: foundTask.text,
          time: reminderTime,
          summary: foundTask.description,
          status: foundTask.completed ? 'Completed' : 'Pending',
        });
        setShowNotificationModal(true);
      }
    });

    const receivedListener = Notifications.addNotificationReceivedListener(notification => {
      console.log('Notification received:', notification);
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
      receivedListener.remove();
    };
  }, [tasks, reminderTime]);

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
      const updated = prev.map((task) => {
        const updatedTask = task.id === id ? { ...task, completed: !task.completed } : task;
  
        if (updatedTask.completed && notificationIds.current[updatedTask.id]) {
          Notifications.cancelScheduledNotificationAsync(notificationIds.current[updatedTask.id]);
          delete notificationIds.current[updatedTask.id];
          console.log(`Cancelled notification for task ${updatedTask.text}`);
        }
  
        return updatedTask;
      });
  
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
      const taskId = selectedTask.id;
      const taskName = selectedTask.text;
  
      // ✅ Prevent reminder for completed tasks
      if (selectedTask.completed) {
        Alert.alert("Reminder not set", "Cannot set a reminder for a completed task.");
        setShowModal(false);
        return; // ⛔ stop here if completed
      }
  
      const now = new Date();
      const triggerDate = new Date();
      triggerDate.setHours(reminderTime.getHours());
      triggerDate.setMinutes(reminderTime.getMinutes());
      triggerDate.setSeconds(0);
  
      const timeDiff = triggerDate.getTime() - now.getTime();
  
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: 'Task Reminder',
          body: `Don't forget to complete: ${taskName}`,
          sound: true,
          channelId: 'default',
          data: { taskId, taskName },
        },
        trigger: timeDiff <= 1000 ? { seconds: 2 } : triggerDate,
      });
  
      // ✅ Save notificationId to cancel if task is completed later
      notificationIds.current[taskId] = notificationId;
    }
  
    setShowModal(false);
  };
  
  
  const handleTestNotification = async () => {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Test Notification',
        body: 'This is a test notification from your app!',
        sound: true,
      },
      trigger: { seconds: 2 },
    });
    console.log('Test notification scheduled');
  };

  const renderItem = ({ item }) => (
    <View style={styles.taskItem}>
      <TouchableOpacity onPress={() => toggleComplete(item.id)} style={styles.checkbox}>
        <Text style={{ fontSize: 18 }}>{item.completed ? '✔' : '○'}</Text>
      </TouchableOpacity>
      
      <TouchableOpacity onPress={() => handleTaskPress(item)} style={{ flex: 1 }}>
        <Text
          style={[
            styles.taskText,
            { textDecorationLine: item.completed ? 'line-through' : 'none' },
          ]}
        >
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
      />

      <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
        <Text style={styles.buttonText}>Test Notification</Text>
      </TouchableOpacity>

      {/* Edit Task Modal */}
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
         <TouchableOpacity
          onPress={() => !selectedTask?.completed && setShowTimePicker(true)}
          style={[styles.timeButton, selectedTask?.completed && { backgroundColor: '#ccc' }]}
          disabled={selectedTask?.completed}
            >
          <Text style={styles.timeText}>
          {reminderTime
          ? `Reminder: ${reminderTime.getHours()}:${reminderTime.getMinutes()}`
          : selectedTask?.completed
          ? 'Completed Task - No Reminder'
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

      {/* Notification Modal */}
      <Modal isVisible={showNotificationModal} onBackdropPress={() => setShowNotificationModal(false)}>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>🔔 Task Notification</Text>
          <Text><Text style={{ fontWeight: 'bold' }}>Task:</Text> {notificationTask?.name}</Text>
          <Text><Text style={{ fontWeight: 'bold' }}>Time:</Text> {reminderTime?.toLocaleTimeString() || 'Not set'}</Text>
          <Text><Text style={{ fontWeight: 'bold' }}>Summary:</Text> {notificationTask?.summary || 'No description'}</Text>
          <Text><Text style={{ fontWeight: 'bold' }}>Status:</Text> {notificationTask?.status}</Text>
          <TouchableOpacity
            style={[styles.saveButton, { marginTop: 12 }]}
            onPress={() => setShowNotificationModal(false)}
          >
            <Text style={styles.buttonText}>Close</Text>
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
  testButton: {
    marginTop: 10,
    backgroundColor: '#009688',
    padding: 12,
    borderRadius: 10,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
});
