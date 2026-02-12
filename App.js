import React, { useEffect, useState } from 'react'
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native'
import HomeScreen from './screens/HomeScreen'
import AlarmScreen from './screens/AlarmScreen'

export default function App() {

  const [tab, setTab] = useState('home')

  return (
    <View style={styles.outer}>
      <View style={styles.phoneFrame}>

        <View style={styles.topBar}>
          <Text style={styles.topTitle}>Water time</Text>
        </View>

        <View style={styles.content}>
          <View style={[styles.screenWrap, tab === 'home' ? styles.screenActive : styles.screenHidden]}>
            <HomeScreen />
          </View>

          <View style={[styles.screenWrap, tab === 'alarms' ? styles.screenActive : styles.screenHidden]}>
            <AlarmScreen />
          </View>
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

  screenWrap: {
    flex: 1
  },

  screenActive: {
    display: 'flex'
  },

  screenHidden: {
    display: 'none'
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
