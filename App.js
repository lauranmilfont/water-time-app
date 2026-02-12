import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'
import HomeScreen from './screens/HomeScreen'
import AlarmScreen from './screens/AlarmScreen'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
})

async function requestPermission() {
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

async function ensureAutoHourlyAlarm() {
  const enabled = await AsyncStorage.getItem('autoHourlyEnabled')
  if (enabled === 'true') return

  const ok = await requestPermission()
  if (!ok) return

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Hora de beber água 💧',
      body: 'Lembrete automático a cada 1h'
    },
    trigger: {
      seconds: 3600,
      repeats: true
    }
  })

  const stored = await AsyncStorage.getItem('alarms')
  const alarms = stored ? JSON.parse(stored) : []

  const newAlarm = {
    id: id,
    type: 'interval',
    label: '60 min (auto)',
    active: true
  }

  await AsyncStorage.setItem('alarms', JSON.stringify([newAlarm, ...alarms]))
  await AsyncStorage.setItem('autoHourlyEnabled', 'true')
}

export default function App() {

  const [tab, setTab] = useState('home')

  useEffect(() => {
    ensureAutoHourlyAlarm()
  }, [])

  return (
    <View style={styles.outer}>
      <View style={styles.phoneFrame}>

        <View style={styles.topBar}>
          <Text style={styles.topTitle}>Water time</Text>
        </View>

        <View style={styles.content}>
          {tab === 'home' ? <HomeScreen /> : <AlarmScreen />}
        </View>

        <View style={styles.bottomBar}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              tab === 'home' ? styles.tabButtonActive : null
            ]}
            onPress={() => setTab('home')}
          >
            <Text
              style={[
                styles.tabText,
                tab === 'home' ? styles.tabTextActive : null
              ]}
            >
              Progresso
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.tabButton,
              tab === 'alarms' ? styles.tabButtonActive : null
            ]}
            onPress={() => setTab('alarms')}
          >
            <Text
              style={[
                styles.tabText,
                tab === 'alarms' ? styles.tabTextActive : null
              ]}
            >
              Alarmes
            </Text>
          </TouchableOpacity>
        </View>

      </View>
    </View>
  )
}

const styles = StyleSheet.create({

  outer: {
    flex: 1,
    backgroundColor: '#0B1B1D',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16
  },

  phoneFrame: {
    width: '100%',
    maxWidth: 420,
    height: Platform.OS === 'web' ? '92vh' : '100%',
    backgroundColor: '#EEF6F7',
    borderRadius: Platform.OS === 'web' ? 24 : 0,
    overflow: 'hidden',
    borderWidth: Platform.OS === 'web' ? 1 : 0,
    borderColor: '#0F3A3E'
  },

  topBar: {
    height: 56,
    backgroundColor: '#5EC4C4',
    alignItems: 'center',
    justifyContent: 'center'
  },

  topTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#ffffff'
  },

  content: {
    flex: 1
  },

  bottomBar: {
    height: 60,
    backgroundColor: '#118A9B',
    flexDirection: 'row'
  },

  tabButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center'
  },

  tabButtonActive: {
    backgroundColor: '#0E7482'
  },

  tabText: {
    color: '#D7F3F3',
    fontWeight: '900'
  },

  tabTextActive: {
    color: '#ffffff'
  }

})
