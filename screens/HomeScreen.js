import React, { useEffect, useMemo, useRef, useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, ScrollView } from 'react-native'
import AsyncStorage from '@react-native-async-storage/async-storage'
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, withSequence } from 'react-native-reanimated'

function todayKey() {
  const d = new Date()
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

export default function HomeScreen() {

  const [step, setStep] = useState('loading')
  const [goal, setGoal] = useState(null)
  const [goalInput, setGoalInput] = useState('')
  const [history, setHistory] = useState([])
  const [customAmount, setCustomAmount] = useState('')
  const [motivation, setMotivation] = useState('')

  const goalReachedRef = useRef(false)

  const consumed = useMemo(
    () => history.reduce((t, i) => t + i.amount, 0),
    [history]
  )

  const fillHeight = useSharedValue(0)
  const dropScale = useSharedValue(1)
  const dropY = useSharedValue(0)

  useEffect(() => {
    loadDataAndResetIfNeeded()
  }, [])

  const loadDataAndResetIfNeeded = async () => {
    const lastDay = await AsyncStorage.getItem('lastDayKey')
    const nowDay = todayKey()

    const storedGoal = await AsyncStorage.getItem('goal')
    const storedHistory = await AsyncStorage.getItem('history')

    if (storedHistory) setHistory(JSON.parse(storedHistory))

    if (lastDay && lastDay !== nowDay) {
      setHistory([])
      setMotivation('')
      goalReachedRef.current = false
      await AsyncStorage.setItem('history', JSON.stringify([]))
    }

    await AsyncStorage.setItem('lastDayKey', nowDay)

    if (storedGoal) {
      setGoal(parseInt(storedGoal))
      setStep('home')
    } else {
      setStep('welcome')
    }
  }

  useEffect(() => {
    AsyncStorage.setItem('history', JSON.stringify(history))
  }, [history])

  useEffect(() => {
    if (goal) AsyncStorage.setItem('goal', goal.toString())
  }, [goal])

  useEffect(() => {
    dropScale.value = withRepeat(
      withSequence(
        withTiming(1.06, { duration: 650 }),
        withTiming(1, { duration: 650 })
      ),
      -1,
      false
    )

    dropY.value = withRepeat(
      withSequence(
        withTiming(-6, { duration: 650 }),
        withTiming(0, { duration: 650 })
      ),
      -1,
      false
    )
  }, [])

  useEffect(() => {
    if (!goal) return

    const pct = Math.min(consumed / goal, 1)
    fillHeight.value = withTiming(pct * 220, { duration: 650 })

    if (consumed >= goal && !goalReachedRef.current) {
      goalReachedRef.current = true
      setMotivation('Meta atingida! Parabéns pela dedicação!!!💙')
      Alert.alert('Meta atingida!', 'Você bateu sua meta de água hoje!')
    }
  }, [consumed, goal])

  const circleFillStyle = useAnimatedStyle(() => ({
    height: fillHeight.value
  }))

  const dropAnimStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: dropY.value },
      { scale: dropScale.value }
    ]
  }))

  const addWater = (amount) => {
    if (!amount || Number.isNaN(amount) || amount <= 0) return

    const now = new Date()
    const time = now.getHours() + ':' + now.getMinutes().toString().padStart(2, '0')

    const newEntry = {
      id: Date.now().toString(),
      amount: amount,
      time: time
    }

    setHistory([newEntry, ...history])
  }

  const saveGoal = () => {
    const parsed = parseInt(goalInput)
    if (!parsed || parsed <= 0) return
    setGoal(parsed)
    setStep('home')
  }

  const resetGoal = async () => {
    await AsyncStorage.removeItem('goal')
    setGoal(null)
    setGoalInput('')
    setStep('goal')
  }

  if (step === 'loading') {
    return (
      <View style={styles.centerFill}>
        <Text style={styles.h1}>Carregando…</Text>
      </View>
    )
  }

  if (step === 'welcome') {
    return (
      <View style={styles.centerFill}>
        <View style={styles.card}>
          <Text style={styles.h1}>Oi! 💧</Text>
          <Text style={styles.p}>Eu vou te ajudar a beber mais água hoje.</Text>

          <TouchableOpacity style={styles.primaryBtn} onPress={() => setStep('goal')}>
            <Text style={styles.primaryBtnText}>Começar</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  if (step === 'goal') {
    return (
      <View style={styles.centerFill}>
        <View style={styles.card}>
          <Text style={styles.h1}>Qual sua meta diária?</Text>

          <TextInput
            placeholder="Ex: 2000"
            keyboardType="numeric"
            value={goalInput}
            onChangeText={setGoalInput}
            style={styles.input}
          />

          <TouchableOpacity style={styles.primaryBtn} onPress={saveGoal}>
            <Text style={styles.primaryBtnText}>Salvar meta</Text>
          </TouchableOpacity>
        </View>
      </View>
    )
  }

  return (
    <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
      <View style={styles.heroCard}>
        <View style={styles.heroCenter}>
          <Animated.View style={dropAnimStyle}>
            <Text style={styles.dropEmoji}>💧</Text>
          </Animated.View>

          <Text style={styles.heroTitleCenter}>Hora de beber água!</Text>
        </View>

        {motivation ? <Text style={styles.motivation}>{motivation}</Text> : null}

        <Text style={styles.counter}>
          {consumed} / {goal} ml
        </Text>

        <TouchableOpacity style={styles.secondaryBtn} onPress={resetGoal}>
          <Text style={styles.secondaryBtnText}>Alterar meta</Text>
        </TouchableOpacity>

        <View style={styles.circle}>
          <View style={styles.circleInner}>
            <Animated.View style={[styles.fill, circleFillStyle]} />
            <Text style={styles.circleText}>
              {Math.min(Math.round((consumed / goal) * 100), 100)}%
            </Text>
          </View>
        </View>

        <View style={styles.row}>
          <TouchableOpacity style={styles.quickBtn} onPress={() => addWater(200)}>
            <Text style={styles.quickBtnText}>+ 200ml</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.quickBtn} onPress={() => addWater(300)}>
            <Text style={styles.quickBtnText}>+ 300ml</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.addRow}>
          <TextInput
            placeholder="Quantidade (ml)"
            keyboardType="numeric"
            value={customAmount}
            onChangeText={setCustomAmount}
            style={styles.inputSmall}
          />

          <TouchableOpacity
            style={styles.primaryBtnSmall}
            onPress={() => {
              addWater(parseInt(customAmount))
              setCustomAmount('')
            }}
          >
            <Text style={styles.primaryBtnText}>Adicionar</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.listCard}>
        <Text style={styles.sectionTitle}>Histórico</Text>

        {history.length === 0 ? (
          <Text style={styles.empty}>Sem registros ainda.</Text>
        ) : (
          history.map((item) => (
            <View key={item.id} style={styles.listRow}>
              <Text style={styles.listLeft}>{item.amount} ml</Text>
              <Text style={styles.listRight}>{item.time}</Text>
            </View>
          ))
        )}
      </View>
    </ScrollView>
  )
}

const styles = StyleSheet.create({
  scroll: {
    flex: 1
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 28
  },
  centerFill: {
    flex: 1,
    padding: 16,
    justifyContent: 'center'
  },
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18
  },
  heroCard: {
    backgroundColor: '#ffffff',
    borderRadius: 18,
    padding: 18
  },
  heroCenter: {
    alignItems: 'center',
    marginBottom: 10
  },
  dropEmoji: {
    fontSize: 110,
    marginBottom: 8
  },
  heroTitleCenter: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0B3B3E'
  },
  h1: {
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 8,
    color: '#0B3B3E'
  },
  p: {
    marginBottom: 14,
    color: '#4B6B6E'
  },
  motivation: {
    marginTop: 12,
    padding: 10,
    borderRadius: 12,
    backgroundColor: '#E8FFF1',
    color: '#0B6B2A',
    fontWeight: '700'
  },
  counter: {
    marginTop: 14,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    color: '#0B3B3E'
  },
  secondaryBtn: {
    marginTop: 10,
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
  circle: {
    marginTop: 14,
    alignItems: 'center'
  },
  circleInner: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#E6F7F8',
    overflow: 'hidden',
    justifyContent: 'flex-end',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#5EC4C4'
  },
  fill: {
    width: '100%',
    backgroundColor: '#5EC4C4'
  },
  circleText: {
    position: 'absolute',
    fontSize: 20,
    fontWeight: '900',
    color: '#0B3B3E'
  },
  row: {
    marginTop: 14,
    flexDirection: 'row',
    gap: 10
  },
  quickBtn: {
    flex: 1,
    backgroundColor: '#118A9B',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center'
  },
  quickBtnText: {
    color: '#ffffff',
    fontWeight: '800'
  },
  addRow: {
    marginTop: 12,
    flexDirection: 'row',
    gap: 10
  },
  input: {
    borderWidth: 1,
    borderColor: '#D6EEEE',
    borderRadius: 14,
    padding: 12,
    marginTop: 10,
    backgroundColor: '#ffffff'
  },
  inputSmall: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#D6EEEE',
    borderRadius: 14,
    padding: 12,
    backgroundColor: '#ffffff'
  },
  primaryBtn: {
    backgroundColor: '#118A9B',
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: 'center'
  },
  primaryBtnSmall: {
    backgroundColor: '#118A9B',
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderRadius: 14,
    alignItems: 'center'
  },
  primaryBtnText: {
    color: '#ffffff',
    fontWeight: '800'
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
  listRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#EEF6F7',
    flexDirection: 'row',
    justifyContent: 'space-between'
  },
  listLeft: {
    fontWeight: '800',
    color: '#0B3B3E'
  },
  listRight: {
    color: '#4B6B6E'
  },
  empty: {
    color: '#4B6B6E'
  }
})
