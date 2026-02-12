import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Platform, Modal } from 'react-native'
import * as Notifications from 'expo-notifications'
import AsyncStorage from '@react-native-async-storage/async-storage'

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false
  })
})

async function requestPermissionNative() {
  const { status } = await Notifications.requestPermissionsAsync()
  return status === 'granted'
}

function parseTimeLabel(label) {
  const parts = label.split(':')
  if (parts.length !== 2) return null

  const h = parseInt(parts[0])
  const m = parseInt(parts[1])

  if (Number.isNaN(h) || Number.isNaN(m)) return null
  if (h < 0 || h > 23) return null
  if (m < 0 || m > 59) return null

  return { hour: h, minute: m }
}

function nextDelayMsForDailyTime(hour, minute) {
  const now = new Date()
  const target = new Date()
  target.setHours(hour)
  target.setMinutes(minute)
  target.setSeconds(0)
  target.setMilliseconds(0)

  if (target.getTime() <= now.getTime()) {
    target.setDate(target.getDate() + 1)
  }

  return target.getTime() - now.getTime()
}

function buildFixedHourlyAlarms() {
  const list = []
  for (let h = 8; h <= 20; h += 1) {
    const label = `${String(h).padStart(2, '0')}:00`
    list.push({
      key: `fixed-${label}`,
      notifId: null,
      type: 'fixed',
      label: label,
      active: true,
      hour: h,
      minute: 0
    })
  }
  return list
}

export default function AlarmScreen() {

  const [alarms, setAlarms] = useState([])
  const [timeInput, setTimeInput] = useState('')

  const [ringVisible, setRingVisible] = useState(false)
  const [ringTitle, setRingTitle] = useState('Hora de beber água 💧')
  const [ringBody, setRingBody] = useState('')

  const timersRef = useRef({})

  const isWeb = useMemo(() => Platform.OS === 'web', [])

  useEffect(() => {
    loadOrCreate()
    return () => {
      clearAllTimers()
    }
  }, [])

  useEffect(() => {
    AsyncStorage.setItem('alarms_fixed', JSON.stringify(alarms))
    if (isWeb) {
      resyncWebTimers(alarms)
    }
  }, [alarms])

  const loadOrCreate = async () => {
    const stored = await AsyncStorage.getItem('alarms_fixed')
    if (stored) {
      setAlarms(JSON.parse(stored))
      return
    }

    setAlarms(buildFixedHourlyAlarms())
  }

  const restoreDefaults = () => {
    setAlarms(buildFixedHourlyAlarms())
  }

  const showRing = (title, body) => {
    setRingTitle(title)
    setRingBody(body)
    setRingVisible(true)
  }

  const clearAllTimers = () => {
    const keys = Object.keys(timersRef.current)
    keys.forEach((k) => {
      const t = timersRef.current[k]
      if (!t) return
      if (t.type === 'timeout') clearTimeout(t.handle)
      timersRef.current[k] = null
      delete timersRef.current[k]
    })
  }

  const scheduleWebAlarm = (alarm) => {
    if (!alarm.active) return

    const scheduleNext = () => {
      const delay = nextDelayMsForDailyTime(alarm.hour, alarm.minute)

      const handle = setTimeout(() => {
        showRing('Hora de beber água 💧', `Alarme: ${alarm.label}`)
        scheduleNext()
      }, delay)

      timersRef.current[alarm.key] = {
        type: 'timeout',
        handle: handle
      }
    }

    scheduleNext()
  }

  const unscheduleWebAlarm = (alarmKey) => {
    const t = timersRef.current[alarmKey]
    if (!t) return
    if (t.type === 'timeout') clearTimeout(t.handle)
    timersRef.current[alarmKey] = null
    delete timersRef.current[alarmKey]
  }

  const resyncWebTimers = (nextAlarms) => {
    const nextKeys = new Set(nextAlarms.map(a => a.key))

    Object.keys(timersRef.current).forEach((k) => {
      if (!nextKeys.has(k)) {
        unscheduleWebAlarm(k)
      }
    })

    nextAlarms.forEach((a) => {
      const already = timersRef.current[a.key]
      if (a.active && !already) scheduleWebAlarm(a)
      if (!a.active && already) unscheduleWebAlarm(a.key)
    })
  }

  const enableNative = async (alarm) => {
    const ok = await requestPermissionNative()
    if (!ok) return null

    const id = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hora de beber água 💧',
        body: `Alarme: ${alarm.label}`
      },
      trigger: {
        hour: alarm.hour,
        minute: alarm.minute,
        repeats: true
      }
    })

    return id
  }

  const disableNative = async (notifId) => {
    if (!notifId) return
    await Notifications.cancelScheduledNotificationAsync(notifId)
  }

  const toggleAlarm = async (alarm) => {
    if (isWeb) {
      if (alarm.active) {
        unscheduleWebAlarm(alarm.key)
      } else {
        scheduleWebAlarm(alarm)
      }

      setAlarms(
        alarms.map(a =>
          a.key === alarm.key
            ? { ...a, active: !a.active }
            : a
        )
      )

      return
    }

    if (alarm.active) {
      await disableNative(alarm.notifId)

      setAlarms(
        alarms.map(a =>
          a.key === alarm.key
            ? { ...a, active: false, notifId: null }
            : a
        )
      )

      return
    }

    const newId = await enableNative(alarm)
    if (!newId) return

    setAlarms(
      alarms.map(a =>
        a.key === alarm.key
          ? { ...a, active: true, notifId: newId }
          : a
      )
    )
  }

  const removeAlarm = async (alarm) => {
    if (isWeb) {
      unscheduleWebAlarm(alarm.key)
      setAlarms(alarms.filter(a => a.key !== alarm.key))
      return
    }

    await disableNative(alarm.notifId)
    setAlarms(alarms.filter(a => a.key !== alarm.key))
  }

  const addCustomAlarm = async () => {
    const parsed = parseTimeLabel(timeInput)
    if (!parsed) return

    const label = `${String(parsed.hour).padStart(2, '0')}:${String(parsed.minute).padStart(2, '0')}`
    const alreadyExists = alarms.some(a => a.label === label)

    if (alreadyExists) {
      setTimeInput('')
      return
    }

    const key = `custom-${label}-${Date.now().toString()}`

    if (isWeb) {
      const newAlarm = {
        key: key,
        notifId: null,
        type: 'custom',
        label: label,
        active: true,
        hour: parsed.hour,
        minute: parsed.minute
      }

      setAlarms([newAlarm, ...alarms])
      setTimeInput('')
      return
    }

    const ok = await requestPermissionNative()
    if (!ok) return

    const notifId = await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Hora de beber água 💧',
        body: `Alarme: ${label}`
      },
      trigger: {
        hour: parsed.hour,
        minute: parsed.minute,
        repeats: true
      }
    })

    const newAlarm = {
      key: key,
      notifId: notifId,
      type: 'custom',
      label: label,
      active: true,
      hour: parsed.hour,
      minute: parsed.minute
    }

    setAlarms([newAlarm, ...alarms])
    setTimeInput('')
  }

  return (
    <View style={styles.page}>
      <Modal
        visible={ringVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setRingVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>{ringTitle}</Text>
            <Text style={styles.modalBody}>{ringBody}</Text>

            <TouchableOpacity style={styles.modalBtn} onPress={() => setRingVisible(false)}>
              <Text style={styles.modalBtnText}>Ok</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.card}>
          <Text style={styles.title}>Alarmes</Text>
          <Text style={styles.subtitle}>Fixos de 08:00 até 20:00 (1h em 1h) + seus horários</Text>

          <Text style={styles.label}>Adicionar horário (HH:MM)</Text>

          <View style={styles.row}>
            <TextInput
              placeholder="Ex: 07:30"
              value={timeInput}
              onChangeText={setTimeInput}
              style={styles.input}
            />

            <TouchableOpacity style={styles.button} onPress={addCustomAlarm}>
              <Text style={styles.buttonText}>Adicionar</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity style={styles.secondaryBtn} onPress={restoreDefaults}>
            <Text style={styles.secondaryBtnText}>Restaurar alarmes padrão (08–20)</Text>
          </TouchableOpacity>

          {isWeb ? (
            <Text style={styles.webHint}>
              No navegador, o alarme aparece como popup enquanto a aba estiver aberta.
            </Text>
          ) : null}
        </View>

        <View style={styles.listCard}>
          <Text style={styles.sectionTitle}>Seus alarmes</Text>

          {alarms.length === 0 ? (
            <Text style={styles.empty}>Você removeu todos os alarmes.</Text>
          ) : (
            alarms.map(item => (
              <View key={item.key} style={styles.alarmRow}>
                <TouchableOpacity style={styles.alarmLeft} onPress={() => toggleAlarm(item)}>
                  <Text style={styles.alarmTitle}>{item.label}</Text>
                  <Text style={styles.alarmSub}>
                    {item.type === 'fixed' ? 'Fixo' : 'Personalizado'} • {item.active ? 'Ativo' : 'Inativo'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity style={styles.removeButton} onPress={() => removeAlarm(item)}>
                  <Text style={styles.removeText}>Deletar</Text>
                </TouchableOpacity>
              </View>
            ))
          )}
        </View>

      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({

  page: {
    flex: 1
  },

  scroll: {
    flex: 1
  },

  scrollContent: {
    padding: 16,
    paddingBottom: 28
  },

  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18
  },

  title: {
    fontSize: 22,
    fontWeight: '900',
    marginBottom: 6,
    color: '#0B3B3E'
  },

  subtitle: {
    color: '#4B6B6E'
  },

  label: {
    marginTop: 12,
    fontWeight: '800',
    color: '#0B3B3E'
  },

  row: {
    flexDirection: 'row',
    marginTop: 10,
    gap: 10
  },

  input: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D6EEEE',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#ffffff'
  },

  button: {
    backgroundColor: '#118A9B',
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center'
  },

  buttonText: {
    color: '#ffffff',
    fontWeight: '900'
  },

  secondaryBtn: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#118A9B',
    paddingVertical: 10,
    borderRadius: 14,
    alignItems: 'center'
  },

  secondaryBtnText: {
    color: '#118A9B',
    fontWeight: '900'
  },

  webHint: {
    marginTop: 12,
    color: '#4B6B6E'
  },

  listCard: {
    marginTop: 12,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: '900',
    marginBottom: 10,
    color: '#0B3B3E'
  },

  alarmRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF6F7'
  },

  alarmLeft: {
    flex: 1
  },

  alarmTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0B3B3E'
  },

  alarmSub: {
    marginTop: 4,
    color: '#4B6B6E'
  },

  removeButton: {
    width: 70,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10
  },

  removeText: {
    color: '#ffffff',
    fontWeight: '900'
  },

  empty: {
    color: '#4B6B6E'
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 18
  },

  modalCard: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18
  },

  modalTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0B3B3E'
  },

  modalBody: {
    marginTop: 8,
    color: '#4B6B6E'
  },

  modalBtn: {
    marginTop: 14,
    backgroundColor: '#118A9B',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center'
  },

  modalBtnText: {
    color: '#ffffff',
    fontWeight: '900'
  }

})
