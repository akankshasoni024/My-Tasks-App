# My Tasks App

This is a beautifully animated and functional **React Native task manager app** Built using Expo development builds, allowing users to manage their tasks efficiently. It supports **dark and light themes**, **local persistence with AsyncStorage**, and **push notifications** for task reminders.



## Features

### Task Management

* Add, edit, delete tasks
* Mark tasks as completed or pending
* Inline task editing with description and priority settings
* Animated task entries with `react-native-animatable`

### Reminders & Notifications

* Set reminders for tasks using a **time picker**
* Receive push notifications using **Expo Notifications**
* Prevent reminders for completed tasks
* Includes a **test notification button** to verify notification functionality
* Notification details modal shows:

  * Task name
  * Reminder time
  * Task summary
  * Status (Completed/Pending)

### Theme Support

* Dynamic **dark and light mode** support using `useColorScheme`
* UI adapts based on system theme

### Local Data Persistence

* All tasks are saved locally using **AsyncStorage**
* Tasks persist even after the app is closed

### Priority Sorting

* Tasks are sorted based on:

  * Completion status
  * Priority (High 🔴 > Medium 🟡 > Low 🟢)

### Smooth UX

* Modals for editing tasks and viewing notifications
* Beautiful animations on task rendering, modals, and buttons

---

## 📸 Screenshots



## 🛠️ Tech Stack

* **React Native** with **Expo**
* **AsyncStorage** for data persistence
* **Expo Notifications** for push notifications
* **@react-native-community/datetimepicker** for setting reminder time
* **react-native-modal** for task and notification modals
* **react-native-animatable** for animations
* **Platform-based Notification Channels** (for Android)

---

## 📲 Installation

1. Clone the repository:


git clone https://github.com/your-username/my-tasks-app.git
cd my-tasks-app


2. Install dependencies:


npm install


3. Run on device:

npx expo start


**Note:** Push notifications only work on physical devices, not on emulators or Expo Go (starting SDK 53+). Create a [Development Build]
(https://docs.expo.dev/develop/development-builds/introduction/) to test notifications.



## Permissions Required

* **Notifications**: App will prompt the user for notification permissions
* **Device-only**: Some notification features require a physical device

## Author

**Akanksha Soni**

* [LinkedIn](https://www.linkedin.com/in/akankshasoni024)
* [GitHub](https://github.com/akankshasoni024)

