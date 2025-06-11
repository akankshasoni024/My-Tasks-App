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
import AsyncStorage from '@react-native-async-storage/async-storage'; 
import * as Notifications from 'expo-notifications';
import Constants from 'expo-constants';
import DateTimePicker from '@react-native-community/datetimepicker';
import Modal from 'react-native-modal';
import { useColorScheme } from 'react-native';
import * as Animatable from 'react-native-animatable';

const lightTheme = {
  background: '#fff',
  text: '#000',
  card: '#f2f2f2',
  inputBorder: '#aaa',
  buttonBackground: '#6C63FF',
  buttonText: '#fff',
  deleteButton: '#e74c3c',
  modalBackground: '#fff',
};

const darkTheme = {
  background: '#121212',
  text: '#fff',
  card: '#1E1E1E',
  inputBorder: '#555',
  buttonBackground: '#BB86FC',
  buttonText: '#000',
  deleteButton: '#cf6679',
  modalBackground: '#1f1f1f',
};


Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const STORAGE_KEY = '@tasks'; 

export default function HomeScreen() {
  const [taskText, setTaskText] = useState('');
  const [tasks, setTasks] = useState([]);
  const [selectedTask, setSelectedTask] = useState(null);
  const [description, setDescription] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [reminderTime, setReminderTime] = useState(null);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [notificationTask, setNotificationTask] = useState(null);
  const [showNotificationModal, setShowNotificationModal] = useState(false);
  const [priority, setPriority] = useState('Medium');

  const colorScheme = useColorScheme();
  const theme = colorScheme === 'dark' ? darkTheme : lightTheme;
  
  const notificationIds = useRef({});

  useEffect(() => {
    loadTasksFromStorage();
  }, []);

  useEffect(() => {
    saveTasksToStorage(tasks);
  }, [tasks]);

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

  // AsyncStorage helpers
  const loadTasksFromStorage = async () => {
    try {
      const storedTasks = await AsyncStorage.getItem(STORAGE_KEY);
      if (storedTasks !== null) {
        setTasks(JSON.parse(storedTasks));
      }
    } catch (e) {
      console.log('Failed to load tasks.', e);
    }
  };

  const saveTasksToStorage = async (tasksToSave) => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(tasksToSave));
    } catch (e) {
      console.log('Failed to save tasks.', e);
    }
  };

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
      console.log('Notice', 'Must use a physical device for notifications');
    }
  }

  const addTask = () => {
    if (!taskText.trim()) return;
    const newTask = {
      id: Date.now().toString(),
      text: taskText.trim(),
      completed: false,
      description: '',
      priority: 'Medium',
    };
    setTasks((prev) => {
      const priorityMap = { High: 0, Medium: 1, Low: 2 };
      const updated = [newTask, ...prev];
      updated.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed - b.completed;
        return priorityMap[a.priority] - priorityMap[b.priority];
      });
      return updated;
    });
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
  
      const priorityMap = { High: 0, Medium: 1, Low: 2 };
      const sorted = updated.sort((a, b) => {
        if (a.completed !== b.completed) return a.completed - b.completed;
        return priorityMap[a.priority] - priorityMap[b.priority];
      });
  
      return [...sorted]; // 🟢 THIS IS IMPORTANT
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
          if (notificationIds.current[id]) {
            Notifications.cancelScheduledNotificationAsync(notificationIds.current[id]);
            delete notificationIds.current[id];
          }
        },
      },
    ]);
  };

  const handleTaskPress = (task) => {
    setSelectedTask(task);
    setDescription(task.description || '');
    setReminderTime(null);
    setShowModal(true);
    setTaskText(task.text); 
    setPriority(task.priority || 'Medium');

  };

  const handleSaveDetails = async () => {
    const updatedTasks = tasks.map((t) =>
      t.id === selectedTask.id
        ? { ...t, text: taskText.trim(), description, priority }
        : t
    );
    
    setTasks(updatedTasks);

    if (reminderTime) {
      const taskId = selectedTask.id;
      const taskName = selectedTask.text;

      // Prevent reminder for completed tasks
      if (selectedTask.completed) {
        Alert.alert("Reminder not set", "Cannot set a reminder for a completed task.");
        setShowModal(false);
        return;
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

  const renderItem = ({ item, index }) => (
    <Animatable.View
      animation="fadeInUp"
      delay={index * 100}
      duration={400}
      useNativeDriver
    >
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
  
        <Text style={{ fontSize: 12, color: '#555' }}>
          {item.priority === 'High' ? '🔴 ' : item.priority === 'Medium' ? '🟡 ' : '🟢 '}
        </Text>
  
        <TouchableOpacity onPress={() => deleteTask(item.id)} style={styles.deleteButton}>
          <Text style={{ color: 'white' }}>Delete</Text>
        </TouchableOpacity>
      </View>
    </Animatable.View>
  );
  
  const styles = createStyles(theme);

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

<Animatable.View animation="pulse" iterationCount="infinite" iterationDelay={4000}>
  <TouchableOpacity style={styles.testButton} onPress={handleTestNotification}>
    <Text style={styles.buttonText}>Test Notification</Text>
  </TouchableOpacity>
</Animatable.View>


      {/* Edit Task Modal */}
      <Modal isVisible={showModal} onBackdropPress={() => setShowModal(false)}>
      <Animatable.View animation="zoomIn" duration={300} useNativeDriver>
        <View style={styles.modalContent}>
          <Text style={styles.modalTitle}>{selectedTask?.text}</Text>
          <TextInput
            style={styles.textArea}
            placeholder="Enter task description..."
            multiline
            value={description}
            onChangeText={setDescription}
          />
          <Text style={{ fontWeight: 'bold', marginBottom: 6 }}>Priority</Text>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
             {['High', 'Medium', 'Low'].map((level) => (
             <TouchableOpacity
             key={level}
             onPress={() => setPriority(level)}
             style={{
             padding: 8,
             borderRadius: 6,
             backgroundColor: priority === level ? '#6C63FF' : '#ddd',
             marginHorizontal: 4,
             }}
             >
              <Text style={{ color: priority === level ? 'white' : 'black' }}>{level}</Text>
             </TouchableOpacity>
            ))}
          </View>

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
        </Animatable.View>

      </Modal>

      {/* Notification Modal */}
      <Modal isVisible={showNotificationModal} onBackdropPress={() => setShowNotificationModal(false)}>
      <Animatable.View animation="fadeInDown" duration={300} useNativeDriver>

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
        </Animatable.View>

      </Modal>
    </View>

  );
}
const createStyles = (theme: typeof lightTheme) =>
  StyleSheet.create({
    container: {
      flex: 1,
      paddingTop: 50,
      alignItems: 'center',
      backgroundColor: theme.background,
    },
    title: {
      fontSize: 28,
      fontWeight: 'bold',
      color: theme.text,
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
      borderColor: theme.inputBorder,
      borderWidth: 1,
      paddingHorizontal: 12,
      paddingVertical: 8,
      borderRadius: 6,
      marginRight: 12,
      color: theme.text,
    },
    taskItem: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      marginHorizontal: 16,
      marginVertical: 6,
      backgroundColor: theme.card,
      borderRadius: 6,
    },
    taskText: {
      fontSize: 16,
      flex: 1,
      color: theme.text,
    },
    deleteButton: {
      backgroundColor: theme.deleteButton,
      paddingHorizontal: 10,
      paddingVertical: 6,
      borderRadius: 4,
    },
    checkbox: {
      marginRight: 10,
    },
    modalContent: {
      backgroundColor: theme.modalBackground,
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
      color: theme.text,
    },
    textArea: {
      borderColor: theme.inputBorder,
      borderWidth: 1,
      borderRadius: 10,
      padding: 10,
      minHeight: 80,
      marginBottom: 12,
      color: theme.text,
    },
    timeButton: {
      padding: 10,
      backgroundColor: theme.card,
      borderRadius: 10,
      marginBottom: 12,
    },
    timeText: {
      color: theme.text,
    },
    saveButton: {
      backgroundColor: theme.buttonBackground,
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
      color: theme.buttonText,
      fontWeight: 'bold',
    },
  });
