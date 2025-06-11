# My Tasks App

A beautifully animated and fully functional **React Native Task Manager App** built using **Expo Development Builds**. This app helps users manage their daily tasks with **local persistence**, **reminders**, **animations**, and **push notifications**.

>The app includes a one-time **animated welcome screen** shown only on the first launch, giving users a delightful onboarding experience.

## Features

### ✅ Task Management

* Add new tasks with a title, description, and priority
* Edit tasks inline
* Mark tasks as **Completed** or **Pending**
* Delete tasks individually
* Sort tasks based on:
  * **Completion status**
  * **Priority**: High 🔴 > Medium 🟡 > Low 🟢

### Reminders & Notifications

* Set a **custom reminder time** for any task
* Receive **push notifications** for reminders using **Expo Notifications**
* Notifications display:
  * Task name
  * Reminder time
  * Summary
  * Status (Completed/Pending)
* Reminder is disabled automatically for completed tasks

### Theme Support

* **Dynamic light and dark mode**
* Follows system theme automatically
* Clean and minimal UI adapting to theme in real time

### Local Data Persistence

* Tasks and their states are **stored using AsyncStorage**
* Your data persists even after app restarts

### 🎨 Beautiful Animations

* Smooth transitions using `react-native-animatable`
* Animated:
  * Task list items
  * Modals
  * Button interactions
* Visually pleasing and responsive UI

### Welcome Screen

* **Shown only once** on the first app launch
* Highlights the app's features with subtle animations

## Tech Stack

| Technology                                 | Purpose                                         |
| ------------------------------------------ | ----------------------------------------------- |
| **React Native**                           | Core mobile development                         |
| **Expo**                                   | Development, builds, and notifications          |
| **AsyncStorage**                           | Save tasks locally                              |
| **Expo Notifications**                     | Schedule and send push notifications            |
| **react-native-modal**                     | Elegant modal overlays                          |
| **react-native-animatable**                | Smooth animations for UI elements               |
| **@react-native-community/datetimepicker** | Time picker for reminders                       |
| **react-navigation**                       | Navigation stack including welcome screen       |
| **Expo Splash/Icons Config**               | Adaptive splash and app icons for all platforms |

## 🚀 Installation

1. **Clone the repository**

   git clone https://github.com/your-username/my-tasks-app.git
   cd my-tasks-app

2. **Install dependencies**

   npm install

3. **Run on device**

   npx expo start

   > **Note**⚠️ Notifications **require a physical device** and won’t work on simulators or Expo Go (after SDK 53+).
   > To test notifications: [Create a development build](https://docs.expo.dev/develop/development-builds/introduction/)


## Permissions

* `Notifications`: Required for task reminders
* Device-only features are disabled on simulators/emulators

---

## 👩Author

**Akanksha Soni**

* [LinkedIn](https://www.linkedin.com/in/akankshasoni024)
* [GitHub](https://github.com/akankshasoni024)

